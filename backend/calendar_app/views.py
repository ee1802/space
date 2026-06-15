from datetime import timedelta

from django.utils import timezone
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from courses.models import Enrollment, Lesson
from homework.models import Homework, Submission
from .models import OlympiadEventType, OlympiadEvent
from .serializers import (
    OlympiadEventTypeSerializer, OlympiadEventSerializer, ScheduleItemSerializer,
)
from core.permissions import IsAdmin


def _parse_date(value):
    """Parse a YYYY-MM-DD query param into a date, or None if missing/invalid."""
    if not value:
        return None
    try:
        return timezone.datetime.strptime(value, '%Y-%m-%d').date()
    except (ValueError, TypeError):
        return None


def _homework_status(problem_ids, submissions_by_problem):
    """Derive an overall homework status from the student's latest submissions.

    not_started -> no submissions for any problem
    pending     -> at least one text answer awaiting check (is_correct is None)
    correct     -> every problem solved correctly
    partial     -> some progress (some correct / partial score) but not all
    wrong       -> attempted but nothing correct
    """
    if not problem_ids:
        return 'not_started'

    statuses = []
    for pid in problem_ids:
        sub = submissions_by_problem.get(pid)
        if sub is None:
            statuses.append('not_started')
        elif sub.is_correct is None:
            statuses.append('pending')
        elif sub.is_correct:
            statuses.append('correct')
        elif sub.score and sub.problem_max_score and 0 < sub.score < sub.problem_max_score:
            statuses.append('partial')
        else:
            statuses.append('wrong')

    if all(s == 'not_started' for s in statuses):
        return 'not_started'
    if 'pending' in statuses:
        return 'pending'
    if all(s == 'correct' for s in statuses):
        return 'correct'
    if any(s in ('correct', 'partial') for s in statuses):
        return 'partial'
    return 'wrong'


# Student views
class EventListView(generics.ListAPIView):
    """List all olympiad events (for students)."""
    serializer_class = OlympiadEventSerializer
    queryset = OlympiadEvent.objects.all()

    def get_queryset(self):
        qs = super().get_queryset()
        start = self.request.query_params.get('start_date')
        end = self.request.query_params.get('end_date')
        event_type = self.request.query_params.get('event_type')
        if start:
            qs = qs.filter(start_date__gte=start)
        if end:
            qs = qs.filter(start_date__lte=end)
        if event_type:
            qs = qs.filter(event_type_id=event_type)
        return qs


class EventTypeListView(generics.ListAPIView):
    """List all event types."""
    serializer_class = OlympiadEventTypeSerializer
    queryset = OlympiadEventType.objects.all()


class MyScheduleView(APIView):
    """Unified chronological feed of upcoming items for the student.

    Combines:
      - olympiad events (OlympiadEvent)
      - homework deadlines for enrolled, published lessons
        (future or within the last 7 days)
      - upcoming lessons in enrolled courses (future)

    Query params:
      ?from=YYYY-MM-DD&to=YYYY-MM-DD  optional window override
      ?kind=olympiad|homework|lesson  optional filter
    Default window: today .. today+60 days, plus overdue homework (last 7 days).
    Sorted ascending by date.
    """

    def get(self, request):
        today = timezone.localdate()

        date_from = _parse_date(request.query_params.get('from')) or today
        date_to = _parse_date(request.query_params.get('to')) or (today + timedelta(days=60))
        kind = request.query_params.get('kind')

        # Homework "overdue" lookback: include deadlines within the last 7 days
        # even when the requested window starts today.
        homework_floor = min(date_from, today - timedelta(days=7))

        enrolled_course_ids = list(
            Enrollment.objects.filter(user=request.user)
            .values_list('course_id', flat=True)
        )

        items = []

        # --- Olympiad events ---
        if kind in (None, 'olympiad'):
            events = OlympiadEvent.objects.filter(
                start_date__gte=date_from,
                start_date__lte=date_to,
            ).select_related('event_type').order_by('start_date')
            for ev in events:
                items.append({
                    'kind': 'olympiad',
                    'id': ev.id,
                    'date': ev.start_date,
                    'time': ev.time,
                    'title': ev.title,
                    'event_type': ev.event_type.name if ev.event_type else None,
                    'color': ev.event_type.color if ev.event_type else None,
                    'external_url': ev.external_url,
                })

        # --- Homework deadlines ---
        if kind in (None, 'homework') and enrolled_course_ids:
            homeworks = Homework.objects.filter(
                lesson__topic__block__course_id__in=enrolled_course_ids,
                lesson__is_published=True,
                due_date__isnull=False,
                due_date__date__gte=homework_floor,
                due_date__date__lte=date_to,
            ).select_related('lesson__topic__block__course').prefetch_related('problems')

            # Gather all problem ids across these homeworks for a single
            # submissions query, then map each user submission to its latest.
            hw_problem_map = {}  # homework_id -> [problem_id, ...]
            all_problem_ids = []
            for hw in homeworks:
                pids = list(hw.problems.values_list('id', flat=True))
                hw_problem_map[hw.id] = pids
                all_problem_ids.extend(pids)

            submissions_by_problem = {}
            if all_problem_ids:
                # ordered oldest->newest so the dict ends on the latest per problem
                subs = (
                    Submission.objects.filter(
                        user=request.user, problem_id__in=all_problem_ids
                    )
                    .select_related('problem')
                    .order_by('submitted_at')
                )
                for sub in subs:
                    sub.problem_max_score = sub.problem.max_score
                    submissions_by_problem[sub.problem_id] = sub

            for hw in homeworks:
                lesson = hw.lesson
                status_val = _homework_status(
                    hw_problem_map.get(hw.id, []), submissions_by_problem
                )
                items.append({
                    'kind': 'homework',
                    'date': timezone.localtime(hw.due_date).date(),
                    'title': f'ДЗ: {lesson.title}',
                    'lesson_id': lesson.id,
                    'course_id': lesson.topic.block.course_id,
                    'status': status_val,
                })

        # --- Upcoming lessons ---
        if kind in (None, 'lesson') and enrolled_course_ids:
            lessons = Lesson.objects.filter(
                topic__block__course_id__in=enrolled_course_ids,
                is_published=True,
                lesson_date__isnull=False,
                lesson_date__gte=date_from,
                lesson_date__lte=date_to,
            ).select_related('topic__block').order_by('lesson_date')
            for lesson in lessons:
                items.append({
                    'kind': 'lesson',
                    'date': lesson.lesson_date,
                    'title': lesson.title,
                    'lesson_id': lesson.id,
                    'course_id': lesson.topic.block.course_id,
                    'lesson_type': lesson.lesson_type,
                })

        items.sort(key=lambda i: (i['date'], i['kind']))

        serializer = ScheduleItemSerializer(items, many=True)
        return Response(serializer.data)


# Admin views
class AdminEventListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdmin]
    serializer_class = OlympiadEventSerializer
    queryset = OlympiadEvent.objects.all()


class AdminEventDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdmin]
    serializer_class = OlympiadEventSerializer
    queryset = OlympiadEvent.objects.all()


class AdminEventTypeListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdmin]
    serializer_class = OlympiadEventTypeSerializer
    queryset = OlympiadEventType.objects.all()


class AdminEventTypeDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdmin]
    serializer_class = OlympiadEventTypeSerializer
    queryset = OlympiadEventType.objects.all()
