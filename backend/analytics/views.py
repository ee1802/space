"""
Read-only analytics aggregations for the student dashboard.

All endpoints are scoped to ``request.user`` and the courses the user is
enrolled in. Nothing here mutates state — only reads from courses, homework,
olympiads, calendar_app and engagement.
"""
import json
import os
import urllib.error
import urllib.request
from datetime import timedelta

from django.db.models import Q
from django.utils import timezone
from rest_framework import permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from courses.models import Enrollment, Lesson, LessonMaterial, LessonProgress
from homework.models import Homework, Problem, Submission
from olympiads.models import MockAttempt
from calendar_app.models import OlympiadEvent


# Human-readable Russian labels for the problem difficulty levels.
LEVEL_LABELS = {
    '': 'Без уровня',
    'school': 'Школьный',
    'municipal': 'Муниципальный',
    'regional': 'Региональный',
    'final': 'Заключительный',
}

# Ascending difficulty order, used when picking a recommended bank level.
LEVEL_ORDER = ['school', 'municipal', 'regional', 'final']


def _enrolled_course_ids(user):
    return list(
        Enrollment.objects.filter(user=user).values_list('course_id', flat=True)
    )


def _latest_submissions_map(user):
    """
    Return a dict {problem_id: Submission} holding the latest submission per
    problem for this user. Accuracy and per-bucket stats are derived from the
    *latest* attempt at each problem (not every historical attempt).
    """
    latest = {}
    qs = (
        Submission.objects.filter(user=user)
        .select_related('problem')
        .order_by('problem_id', '-submitted_at')
    )
    for sub in qs:
        if sub.problem_id not in latest:
            latest[sub.problem_id] = sub
    return latest


def _is_solved(sub):
    """True when the latest submission counts as fully correct."""
    return sub.is_correct is True


def _build_stats(user):
    """Compute the full /api/me/stats payload for a user. Reused by recs."""
    enrolled_course_ids = _enrolled_course_ids(user)

    # --- raw submission counts -------------------------------------------------
    total_submissions = Submission.objects.filter(user=user).count()

    latest = _latest_submissions_map(user)
    latest_subs = list(latest.values())
    total_attempted = len(latest_subs)

    # Auto-graded problems that have a definitive correct/incorrect verdict are
    # the basis for accuracy. Pending text answers (is_correct is None) are
    # excluded from the denominator so they don't drag accuracy down.
    graded = [s for s in latest_subs if s.is_correct is not None]
    solved_problems = sum(1 for s in latest_subs if _is_solved(s))
    accuracy = round(100 * sum(1 for s in graded if s.is_correct) / len(graded)) if graded else 0

    # --- lessons watched -------------------------------------------------------
    published_lessons_qs = Lesson.objects.filter(
        topic__block__course_id__in=enrolled_course_ids,
        is_published=True,
    )
    lessons_total = published_lessons_qs.count()
    published_lesson_ids = set(published_lessons_qs.values_list('id', flat=True))
    lessons_watched = LessonProgress.objects.filter(
        user=user, is_watched=True, lesson_id__in=published_lesson_ids,
    ).count()

    # --- preload tags / levels / answer types for the latest problems ----------
    problem_ids = list(latest.keys())
    problems = (
        Problem.objects.filter(id__in=problem_ids)
        .prefetch_related('tags')
    )
    problem_map = {p.id: p for p in problems}

    # --- by_topic (group by tag) ----------------------------------------------
    topic_acc = {}  # slug -> {'tag', 'slug', 'attempted', 'correct'}
    for pid, sub in latest.items():
        problem = problem_map.get(pid)
        if not problem:
            continue
        for tag in problem.tags.all():
            bucket = topic_acc.setdefault(
                tag.slug, {'tag': tag.name, 'slug': tag.slug, 'attempted': 0, 'correct': 0}
            )
            bucket['attempted'] += 1
            if _is_solved(sub):
                bucket['correct'] += 1

    by_topic = []
    for bucket in topic_acc.values():
        if bucket['attempted'] <= 0:
            continue
        bucket['accuracy'] = round(100 * bucket['correct'] / bucket['attempted'])
        by_topic.append(bucket)
    # Weakest first (lowest accuracy), then most-attempted to break ties.
    by_topic.sort(key=lambda b: (b['accuracy'], -b['attempted']))

    # --- by_level --------------------------------------------------------------
    level_acc = {}  # level -> {'attempted', 'correct'}
    for pid, sub in latest.items():
        problem = problem_map.get(pid)
        if not problem:
            continue
        level = problem.level or ''
        bucket = level_acc.setdefault(level, {'attempted': 0, 'correct': 0})
        bucket['attempted'] += 1
        if _is_solved(sub):
            bucket['correct'] += 1

    by_level = []
    for level, bucket in level_acc.items():
        attempted = bucket['attempted']
        by_level.append({
            'level': level,
            'label': LEVEL_LABELS.get(level, level or 'Без уровня'),
            'attempted': attempted,
            'correct': bucket['correct'],
            'accuracy': round(100 * bucket['correct'] / attempted) if attempted else 0,
        })
    # Order by canonical difficulty, unknown levels last.
    by_level.sort(key=lambda b: LEVEL_ORDER.index(b['level']) if b['level'] in LEVEL_ORDER else len(LEVEL_ORDER))

    # --- by_answer_type --------------------------------------------------------
    type_acc = {}  # answer_type -> {'attempted', 'correct'}
    for pid, sub in latest.items():
        problem = problem_map.get(pid)
        if not problem:
            continue
        bucket = type_acc.setdefault(problem.answer_type, {'attempted': 0, 'correct': 0})
        bucket['attempted'] += 1
        if _is_solved(sub):
            bucket['correct'] += 1

    by_answer_type = [
        {'answer_type': at, 'attempted': b['attempted'], 'correct': b['correct']}
        for at, b in sorted(type_acc.items(), key=lambda kv: -kv[1]['attempted'])
    ]

    # --- recent_activity (last 30 days, submissions per day) -------------------
    today = timezone.localdate()
    start = today - timedelta(days=29)
    recent_counts = {}
    recent_qs = Submission.objects.filter(
        user=user, submitted_at__date__gte=start,
    ).values_list('submitted_at', flat=True)
    for ts in recent_qs:
        d = timezone.localtime(ts).date() if timezone.is_aware(ts) else ts.date()
        key = d.isoformat()
        recent_counts[key] = recent_counts.get(key, 0) + 1
    recent_activity = []
    for i in range(30):
        d = start + timedelta(days=i)
        key = d.isoformat()
        recent_activity.append({'date': key, 'count': recent_counts.get(key, 0)})

    # --- mock attempts ---------------------------------------------------------
    mock_qs = MockAttempt.objects.filter(user=user, is_completed=True)
    mock_attempts = mock_qs.count()
    best_mock_percent = 0
    for att in mock_qs:
        if att.max_score and att.max_score > 0 and att.score is not None:
            pct = round(100 * att.score / att.max_score)
            best_mock_percent = max(best_mock_percent, pct)

    # --- strengths / weaknesses ------------------------------------------------
    strengths = [
        b['tag'] for b in by_topic
        if b['accuracy'] >= 70 and b['attempted'] >= 3
    ]
    weaknesses = [
        b['tag'] for b in by_topic
        if b['accuracy'] < 50 and b['attempted'] >= 2
    ]

    return {
        'total_submissions': total_submissions,
        'solved_problems': solved_problems,
        'total_attempted': total_attempted,
        'accuracy': accuracy,
        'lessons_watched': lessons_watched,
        'lessons_total': lessons_total,
        'by_topic': by_topic,
        'by_level': by_level,
        'by_answer_type': by_answer_type,
        'recent_activity': recent_activity,
        'mock_attempts': mock_attempts,
        'best_mock_percent': best_mock_percent,
        'strengths': strengths,
        'weaknesses': weaknesses,
    }


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def me_stats(request):
    """GET /api/me/stats — aggregated student statistics."""
    return Response(_build_stats(request.user))


# ---------------------------------------------------------------------------
# Recommendations
# ---------------------------------------------------------------------------

def _heuristic_recommendations(user, stats):
    """
    Build a ranked list of concrete study recommendations from derived signals.
    Returns a list of dicts (4-8 items). Priority: 1 = highest.
    """
    enrolled_course_ids = _enrolled_course_ids(user)
    items = []

    now = timezone.now()
    today = timezone.localdate()

    # 1. Overdue homework (highest urgency) -----------------------------------
    # A homework problem is "done" once the student has any submission for it.
    done_problem_ids = set(
        Submission.objects.filter(user=user).values_list('problem_id', flat=True)
    )
    overdue_hw = (
        Homework.objects.filter(
            due_date__lt=now,
            lesson__topic__block__course_id__in=enrolled_course_ids,
            lesson__is_published=True,
        )
        .select_related('lesson')
        .order_by('due_date')
    )
    for hw in overdue_hw:
        hw_problem_ids = list(hw.problems.values_list('id', flat=True))
        if not hw_problem_ids:
            continue
        if all(pid in done_problem_ids for pid in hw_problem_ids):
            continue  # fully attempted, skip
        lesson = hw.lesson
        items.append({
            'type': 'overdue_homework',
            'title': f'Доделайте просроченное ДЗ: {hw.title or lesson.title}',
            'reason': 'Дедлайн уже прошёл, а задания ещё не сданы. Наверстайте, чтобы не копить долги.',
            'action_url': f'/app/lessons/{lesson.id}',
            'priority': 1,
        })
        if len([i for i in items if i['type'] == 'overdue_homework']) >= 2:
            break

    # 2. Weakest topics --------------------------------------------------------
    for bucket in stats['by_topic']:
        if bucket['accuracy'] < 50 and bucket['attempted'] >= 2:
            items.append({
                'type': 'weak_topic',
                'title': f'Подтяните тему «{bucket["tag"]}»',
                'reason': (
                    f'Точность по этой теме всего {bucket["accuracy"]}% '
                    f'({bucket["correct"]} из {bucket["attempted"]}). '
                    'Порешайте задачи из банка с этим тегом и пересмотрите уроки.'
                ),
                'action_url': f'/app/bank?tag={bucket["slug"]}',
                'priority': 1,
                'tag': bucket['slug'],
            })
        if len([i for i in items if i['type'] == 'weak_topic']) >= 2:
            break

    # 3. Mistakes to redo ------------------------------------------------------
    latest = _latest_submissions_map(user)
    wrong_count = sum(1 for s in latest.values() if s.is_correct is False)
    if wrong_count > 0:
        items.append({
            'type': 'redo_mistakes',
            'title': f'Разберите ошибки ({wrong_count})',
            'reason': (
                f'У вас {wrong_count} задач(и) с неверным ответом. '
                'Перерешайте их в разделе «Работа над ошибками» — это самый быстрый прирост.'
            ),
            'action_url': '/app/mistakes',
            'priority': 2,
        })

    # 4. Unwatched published lessons (in course order) -------------------------
    watched_lesson_ids = set(
        LessonProgress.objects.filter(user=user, is_watched=True)
        .values_list('lesson_id', flat=True)
    )
    unwatched = (
        Lesson.objects.filter(
            topic__block__course_id__in=enrolled_course_ids,
            is_published=True,
        )
        .exclude(id__in=watched_lesson_ids)
        .select_related('topic__block__course')
        .order_by(
            'topic__block__course__id', 'topic__block__order',
            'topic__order', 'order',
        )
    )
    next_lesson = unwatched.first()
    if next_lesson is not None:
        unwatched_total = unwatched.count()
        course = next_lesson.topic.block.course
        items.append({
            'type': 'watch_lesson',
            'title': f'Продолжите обучение: «{next_lesson.title}»',
            'reason': (
                f'Это следующий непросмотренный урок в курсе «{course.title}». '
                f'Всего непросмотренных уроков: {unwatched_total}.'
            ),
            'action_url': f'/app/lessons/{next_lesson.id}',
            'priority': 2,
        })

    # 5. Bank problems at the student's level not yet solved -------------------
    # Determine the student's working level: hardest level where they already
    # have decent accuracy, otherwise the easiest unmastered one.
    target_level = 'school'
    for lvl in LEVEL_ORDER:
        bucket = next((b for b in stats['by_level'] if b['level'] == lvl), None)
        if bucket and bucket['attempted'] >= 2 and bucket['accuracy'] >= 60:
            target_level = lvl  # comfortable here, aim a notch up next
    # Aim one level above the comfortable one when possible.
    idx = LEVEL_ORDER.index(target_level)
    aim_level = LEVEL_ORDER[min(idx + 1, len(LEVEL_ORDER) - 1)] if stats['total_attempted'] else 'school'

    solved_ids = {pid for pid, s in latest.items() if s.is_correct is True}
    unsolved_bank = (
        Problem.objects.filter(in_bank=True, level=aim_level)
        .exclude(id__in=solved_ids)
        .count()
    )
    if unsolved_bank > 0:
        items.append({
            'type': 'bank_level',
            'title': f'Решите задачи уровня «{LEVEL_LABELS.get(aim_level, aim_level)}»',
            'reason': (
                f'В банке есть {unsolved_bank} нерешённых задач этого уровня. '
                'Регулярная практика на своём уровне закрепляет результат.'
            ),
            'action_url': f'/app/bank?level={aim_level}',
            'priority': 3,
        })

    # 6. Upcoming olympiad events within 30 days -> suggest a mock ------------
    horizon = today + timedelta(days=30)
    upcoming = (
        OlympiadEvent.objects.filter(
            start_date__gte=today, start_date__lte=horizon,
        )
        .order_by('start_date')
        .first()
    )
    if upcoming is not None:
        days_left = (upcoming.start_date - today).days
        items.append({
            'type': 'upcoming_event',
            'title': f'Готовьтесь к «{upcoming.title}»',
            'reason': (
                f'До события осталось {days_left} дн. '
                'Пройдите пробную олимпиаду на время, чтобы проверить себя в боевых условиях.'
            ),
            'action_url': '/app/mock',
            'priority': 2,
        })

    # 7. Strength reinforcement / fallback when there is little data ----------
    if stats['strengths']:
        strong = stats['strengths'][0]
        items.append({
            'type': 'strength',
            'title': f'Закрепите сильную тему «{strong}»',
            'reason': 'У вас отличный результат по этой теме — возьмите задачи посложнее, чтобы выйти на новый уровень.',
            'action_url': '/app/bank',
            'priority': 3,
        })

    if not items:
        # Cold-start: no activity yet.
        items.append({
            'type': 'get_started',
            'title': 'Начните с первого урока',
            'reason': 'Похоже, вы только начинаете. Посмотрите вводные уроки и решите первые задачи — статистика появится сразу.',
            'action_url': '/app/courses',
            'priority': 1,
        })

    # Sort by priority, keep 4-8 items.
    items.sort(key=lambda i: i['priority'])
    return items[:8]


# Short focus label per recommendation type, used to build the weekly plan.
FOCUS_LABELS = {
    'overdue_homework': 'Закрыть долги по ДЗ',
    'weak_topic': 'Подтянуть слабую тему',
    'redo_mistakes': 'Разобрать ошибки',
    'watch_lesson': 'Пройти следующий урок',
    'bank_level': 'Решать задачи своего уровня',
    'upcoming_event': 'Прорешать пробник перед олимпиадой',
    'strength': 'Усложнить сильную тему',
    'get_started': 'Начать с вводных уроков',
}


def _active_days_and_streak(stats):
    """From the 30-day recent_activity series: (active_days, current_streak)."""
    series = stats.get('recent_activity') or []
    active_days = sum(1 for d in series if d.get('count', 0) > 0)
    streak = 0
    for d in reversed(series):  # newest entry is last
        if d.get('count', 0) > 0:
            streak += 1
        else:
            break
    return active_days, streak


def _build_insight(stats):
    """
    Deterministic, personalised study insight (Russian, 1-4 sentences).
    Always available; the AI layer may replace it with a warmer version.
    """
    attempted = stats['total_attempted']
    watched = stats['lessons_watched']
    if attempted == 0 and watched == 0:
        return (
            'Вы только начинаете путь в астрономии. Посмотрите вводные уроки и решите '
            'первые задачи — здесь сразу появится персональный разбор вашего прогресса.'
        )

    parts = []
    if attempted:
        parts.append(
            f'Решено задач: {stats["solved_problems"]} из {attempted}, '
            f'точность {stats["accuracy"]}%.'
        )
    if stats['lessons_total']:
        parts.append(f'Просмотрено уроков: {watched} из {stats["lessons_total"]}.')

    strong = stats['strengths']
    if strong:
        names = ' и '.join(f'«{s}»' for s in strong[:2])
        parts.append(f'Сильнее всего идёт {names}.')

    weak = stats['weaknesses']
    if weak:
        names = ', '.join(f'«{w}»' for w in weak[:2])
        parts.append(f'В первую очередь стоит подтянуть {names}.')
    elif stats['accuracy'] and stats['accuracy'] < 60 and attempted >= 2:
        parts.append('Поработайте над точностью — разбирайте ошибку сразу после решения.')

    if stats['mock_attempts']:
        parts.append(f'Лучший результат на пробнике: {stats["best_mock_percent"]}%.')

    active_days, streak = _active_days_and_streak(stats)
    if streak >= 3:
        parts.append(f'Вы занимаетесь {streak} дн. подряд — отличный темп, не сбавляйте!')
    elif active_days == 0:
        parts.append('Давно не было активности — вернитесь к задачам, чтобы не терять форму.')

    return ' '.join(parts)


def _build_study_plan(items):
    """Turn the top prioritised recommendations into a short ordered weekly plan."""
    plan = []
    for item in items:
        if len(plan) >= 4:
            break
        focus = FOCUS_LABELS.get(item['type'])
        if not focus:
            continue
        plan.append({
            'step': len(plan) + 1,
            'focus': focus,
            'detail': item['title'],
            'action_url': item['action_url'],
        })
    return plan


def _ai_student_context(stats):
    """Compact but rich JSON-able context describing the student for the model."""
    active_days, streak = _active_days_and_streak(stats)
    return {
        'точность_%': stats['accuracy'],
        'решено_задач': stats['solved_problems'],
        'всего_попыток': stats['total_attempted'],
        'уроков_просмотрено': stats['lessons_watched'],
        'уроков_всего': stats['lessons_total'],
        'по_темам': [
            {'тема': b['tag'], 'точность_%': b['accuracy'], 'решено': f'{b["correct"]}/{b["attempted"]}'}
            for b in stats['by_topic'][:6]
        ],
        'по_этапам': [
            {'этап': b['label'], 'точность_%': b['accuracy'], 'решено': f'{b["correct"]}/{b["attempted"]}'}
            for b in stats['by_level']
        ],
        'сильные_темы': stats['strengths'],
        'слабые_темы': stats['weaknesses'],
        'пробников_пройдено': stats['mock_attempts'],
        'лучший_пробник_%': stats['best_mock_percent'],
        'активных_дней_за_30': active_days,
        'серия_дней_подряд': streak,
    }


def _clip(value, lo, hi):
    """Trimmed string if its length is within [lo, hi], else None. Rejects
    empty / junk / over-long AI text so it can never overwrite good copy."""
    if value is None:
        return None
    s = str(value).strip()
    return s if lo <= len(s) <= hi else None


def _maybe_enrich_with_ai(stats, items, summary, study_plan):
    """
    Deep AI layer: if ANTHROPIC_API_KEY is present, ask claude-fable-5 to
    (1) write a personal insight summary, (2) reword each recommendation, and
    (3) reword the weekly plan — all grounded in the full student stats.

    The model NEVER controls links/types/priority/ordering (server-authoritative);
    it only rewrites TEXT, validated by strict length checks. Falls back to the
    deterministic summary + heuristic items + heuristic plan on ANY error.
    Returns (items, summary, study_plan, generated_by).
    """
    api_key = os.environ.get('ANTHROPIC_API_KEY')
    if not api_key:
        return items, summary, study_plan, 'heuristic'

    try:
        context = _ai_student_context(stats)
        recs_payload = [{'type': i['type'], 'title': i['title'], 'reason': i['reason']} for i in items]
        plan_payload = [{'focus': p['focus'], 'detail': p['detail']} for p in study_plan]
        prompt = (
            'Ты — опытный и доброжелательный наставник по подготовке к олимпиадам по '
            'астрономии (онлайн-школа «Апекс»). Данные ученика (JSON):\n'
            + json.dumps(context, ensure_ascii=False)
            + '\n\nЧерновые рекомендации (нельзя менять количество, порядок и смысл):\n'
            + json.dumps(recs_payload, ensure_ascii=False)
            + '\n\nЧерновой план на неделю:\n'
            + json.dumps(plan_payload, ensure_ascii=False)
            + '\n\nВерни СТРОГО один JSON-объект без пояснений и без markdown:\n'
            '{"summary": "тёплый персональный разбор на русском в 2-3 предложениях: '
            'прогресс, сильные стороны и над чем поработать в первую очередь", '
            '"items": [{"title": "...", "reason": "..."}], '
            '"plan": [{"focus": "коротко", "detail": "по делу"}]}\n'
            'Массивы items и plan — той же длины и в том же порядке, что и черновики. '
            'Пиши мотивирующе и конкретно, опираясь на цифры ученика.'
        )

        body = json.dumps({
            'model': 'claude-fable-5',
            'max_tokens': 2048,
            'messages': [{'role': 'user', 'content': prompt}],
        }).encode('utf-8')

        req = urllib.request.Request(
            'https://api.anthropic.com/v1/messages',
            data=body,
            headers={
                'content-type': 'application/json',
                'x-api-key': api_key,
                'anthropic-version': '2023-06-01',
            },
            method='POST',
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))

        text = ''.join(
            block.get('text', '')
            for block in data.get('content', [])
            if block.get('type') == 'text'
        ).strip()
        # Strip a possible markdown code fence.
        if text.startswith('```'):
            text = text.strip('`')
            if text.startswith('json'):
                text = text[4:]
            text = text.strip()
        parsed = json.loads(text)
        if not isinstance(parsed, dict):
            return items, summary, study_plan, 'heuristic'

        # Server-authoritative: only TEXT is taken from the model, and only when
        # it passes length bounds. Links/types/priority/ordering never change.
        s = _clip(parsed.get('summary'), 20, 600)
        ai_summary = s if s else summary

        new_items = parsed.get('items')
        if isinstance(new_items, list) and len(new_items) == len(items):
            for original, new in zip(items, new_items):
                if isinstance(new, dict):
                    title = _clip(new.get('title'), 3, 120)
                    reason = _clip(new.get('reason'), 10, 400)
                    if title:
                        original['title'] = title
                    if reason:
                        original['reason'] = reason

        new_plan = parsed.get('plan')
        if isinstance(new_plan, list) and len(new_plan) == len(study_plan):
            for original, new in zip(study_plan, new_plan):
                if isinstance(new, dict):
                    focus = _clip(new.get('focus'), 3, 60)
                    detail = _clip(new.get('detail'), 3, 200)
                    if focus:
                        original['focus'] = focus
                    if detail:
                        original['detail'] = detail

        return items, ai_summary, study_plan, 'ai'
    except (urllib.error.URLError, urllib.error.HTTPError, ValueError, KeyError,
            TypeError, OSError, json.JSONDecodeError):
        pass
    except Exception:
        # Never let AI enrichment break the endpoint.
        pass

    return items, summary, study_plan, 'heuristic'


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def me_recommendations(request):
    """GET /api/me/recommendations — personalised study insight, recommendations
    and a weekly plan. Deterministic by default; deeply AI-enriched (insight,
    wording and plan) when ANTHROPIC_API_KEY is configured."""
    stats = _build_stats(request.user)
    items = _heuristic_recommendations(request.user, stats)
    summary = _build_insight(stats)
    study_plan = _build_study_plan(items)
    items, summary, study_plan, generated_by = _maybe_enrich_with_ai(
        stats, items, summary, study_plan,
    )
    return Response({
        'generated_by': generated_by,
        'summary': summary,
        'items': items,
        'study_plan': study_plan,
    })


# ---------------------------------------------------------------------------
# Unified search
# ---------------------------------------------------------------------------

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def search(request):
    """
    GET /api/search?q=... — unified search across the student's enrolled content.
    Returns lessons, problems and materials matching ``q`` (case-insensitive),
    limited to ~10 each. Empty query returns empty results.
    """
    q = (request.query_params.get('q') or '').strip()
    if not q:
        return Response({'lessons': [], 'problems': [], 'materials': []})

    enrolled_course_ids = _enrolled_course_ids(request.user)

    # --- lessons --------------------------------------------------------------
    lesson_qs = (
        Lesson.objects.filter(
            topic__block__course_id__in=enrolled_course_ids,
            is_published=True,
            title__icontains=q,
        )
        .select_related('topic__block__course')
        .order_by('topic__block__order', 'topic__order', 'order')[:10]
    )
    lessons = [
        {
            'id': lesson.id,
            'title': lesson.title,
            'course_id': lesson.topic.block.course_id,
            'course_title': lesson.topic.block.course.title,
        }
        for lesson in lesson_qs
    ]

    # --- problems -------------------------------------------------------------
    # Search the homework problems inside enrolled courses plus bank problems,
    # matching against title, statement or tag name.
    accessible_problems = Problem.objects.filter(
        homework__lesson__topic__block__course_id__in=enrolled_course_ids,
        homework__lesson__is_published=True,
    )
    bank_problems = Problem.objects.filter(in_bank=True)
    visible = accessible_problems | bank_problems
    problem_qs = (
        visible.filter(
            Q(title__icontains=q)
            | Q(statement__icontains=q)
            | Q(tags__name__icontains=q)
        )
        .distinct()
        .prefetch_related('tags')[:10]
    )
    problems = []
    for problem in problem_qs:
        statement = problem.statement or ''
        excerpt = statement[:160] + ('…' if len(statement) > 160 else '')
        problems.append({
            'id': problem.id,
            'title': problem.title or f'Задача {problem.order}',
            'statement_excerpt': excerpt,
            'level': problem.level,
            'tags': [t.name for t in problem.tags.all()],
        })

    # --- materials ------------------------------------------------------------
    material_qs = (
        LessonMaterial.objects.filter(
            lesson__topic__block__course_id__in=enrolled_course_ids,
            lesson__is_published=True,
            title__icontains=q,
        )
        .order_by('order')[:10]
    )
    materials = [
        {
            'id': mat.id,
            'title': mat.title,
            'kind': mat.kind,
            'lesson_id': mat.lesson_id,
        }
        for mat in material_qs
    ]

    return Response({
        'lessons': lessons,
        'problems': problems,
        'materials': materials,
    })
