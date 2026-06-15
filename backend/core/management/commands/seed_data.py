from django.core.management.base import BaseCommand
from django.utils import timezone
from django.utils.text import slugify
from django.core.files.base import ContentFile
from datetime import date, timedelta

from core.models import User
from courses.models import Course, Enrollment, Block, Topic, Lesson, LessonProgress, LessonMaterial
from homework.models import Homework, Problem, ProblemOption, Tag, Submission
from homework.grading import grade_answer
from calendar_app.models import OlympiadEventType, OlympiadEvent
from olympiads.models import MockOlympiad, MockProblem
from engagement.models import Favorite, LessonRating, Question


def _minimal_pdf(title_text):
    """Build a tiny but valid single-page PDF (correct xref offsets) in memory."""
    def obj(n, body):
        return f'{n} 0 obj\n{body}\nendobj\n'.encode('latin-1')

    content = f'BT /F1 18 Tf 60 760 Td ({title_text}) Tj ET'.encode('latin-1')
    stream = b'4 0 obj\n<< /Length ' + str(len(content)).encode() + b' >>\nstream\n' + content + b'\nendstream\nendobj\n'

    parts = [b'%PDF-1.4\n']
    objects = [
        obj(1, '<< /Type /Catalog /Pages 2 0 R >>'),
        obj(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>'),
        obj(3, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] '
               '/Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>'),
        stream,
        obj(5, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'),
    ]
    offsets = []
    cursor = len(parts[0])
    for o in objects:
        offsets.append(cursor)
        cursor += len(o)
        parts.append(o)
    xref_pos = cursor
    xref = ['xref\n', '0 6\n', '0000000000 65535 f \n']
    for off in offsets:
        xref.append(f'{off:010d} 00000 n \n')
    parts.append(''.join(xref).encode('latin-1'))
    parts.append(f'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n{xref_pos}\n%%EOF'.encode('latin-1'))
    return b''.join(parts)


class Command(BaseCommand):
    help = 'Seed database with rich test data'

    def handle(self, *args, **options):
        self.stdout.write('Seeding database...')

        # ---- Users ----
        admin, created = User.objects.get_or_create(
            email='admin@apeks.space',
            defaults={
                'full_name': 'Евгений Бойцов',
                'telegram_username': '@eugene_boitsov',
                'is_admin': True, 'is_staff': True, 'is_superuser': True,
                'is_email_verified': True,
            },
        )
        if created:
            admin.set_password('admin123')
            admin.save()
            self.stdout.write(f'  Created admin: {admin.email} / admin123')

        student1, created = User.objects.get_or_create(
            email='student1@test.com',
            defaults={'full_name': 'Иван Петров', 'telegram_username': '@ivan_petrov', 'is_email_verified': True},
        )
        if created:
            student1.set_password('student123')
            student1.save()
            self.stdout.write(f'  Created student: {student1.email} / student123')

        student2, created = User.objects.get_or_create(
            email='student2@test.com',
            defaults={'full_name': 'Мария Сидорова', 'telegram_username': '@maria_sid', 'is_email_verified': True},
        )
        if created:
            student2.set_password('student123')
            student2.save()
            self.stdout.write(f'  Created student: {student2.email} / student123')

        # ---- Tags (темы) ----
        tag_names = [
            'Законы Кеплера', 'Гравитация', 'Космические скорости', 'Звёздные величины',
            'Формула Погсона', 'Небесные координаты', 'Параллакс', 'Эклиптика',
        ]
        tags = {}
        for name in tag_names:
            t, _ = Tag.objects.get_or_create(name=name, defaults={'slug': slugify(name, allow_unicode=False) or name.lower().replace(' ', '-')})
            if not t.slug:
                t.slug = (slugify(name) or f'tag-{t.id}')
                t.save()
            tags[name] = t

        # ---- Course ----
        course, _ = Course.objects.get_or_create(
            slug='vseros-s-apeksom',
            defaults={
                'title': 'Всерос с Апексом',
                'description': 'Годовой курс подготовки к ВсОШ по астрономии. 12 пар в неделю: астрономия старшего и младшего потока, физика и математика для астрономов, звёздное небо.',
                'is_published': True,
            },
        )
        self.stdout.write(f'  Course: {course.title}')
        Enrollment.objects.get_or_create(user=student1, course=course)
        Enrollment.objects.get_or_create(user=student2, course=course)

        # ---- Blocks / topics / lessons ----
        block1, _ = Block.objects.get_or_create(
            course=course, order=1,
            defaults={'title': 'Небесная механика', 'description': 'Основы небесной механики и орбитального движения.'},
        )
        topic1_1, _ = Topic.objects.get_or_create(
            block=block1, order=1,
            defaults={'title': 'Законы Кеплера', 'description': 'Три закона Кеплера и их применение.'},
        )
        lesson1_1_1, _ = Lesson.objects.get_or_create(
            topic=topic1_1, order=1,
            defaults={
                'title': 'Первый и второй законы Кеплера',
                'lesson_date': date.today() - timedelta(days=14),
                'video_url': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'description': '## Первый закон Кеплера\n\nОрбита каждой планеты есть эллипс, в одном из фокусов которого находится Солнце.\n\n## Второй закон Кеплера\n\nРадиус-вектор планеты за равные промежутки времени описывает равные площади.',
                'is_published': True,
            },
        )
        lesson1_1_2, _ = Lesson.objects.get_or_create(
            topic=topic1_1, order=2,
            defaults={
                'title': 'Третий закон Кеплера',
                'lesson_date': date.today() - timedelta(days=7),
                'video_url': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'description': '## Третий закон Кеплера\n\n$\\frac{T_1^2}{T_2^2} = \\frac{a_1^3}{a_2^3}$\n\nОтношение квадратов периодов обращения планет равно отношению кубов больших полуосей их орбит.',
                'is_published': True,
            },
        )
        topic1_2, _ = Topic.objects.get_or_create(
            block=block1, order=2,
            defaults={'title': 'Гравитация', 'description': 'Закон всемирного тяготения и его следствия.'},
        )
        lesson1_2_1, _ = Lesson.objects.get_or_create(
            topic=topic1_2, order=1,
            defaults={
                'title': 'Закон всемирного тяготения',
                'lesson_date': date.today(),
                'video_url': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'description': '## Закон всемирного тяготения\n\n$F = G \\frac{m_1 m_2}{r^2}$',
                'is_published': True,
            },
        )
        lesson1_2_2, _ = Lesson.objects.get_or_create(
            topic=topic1_2, order=2,
            defaults={
                'title': 'Космические скорости',
                'lesson_date': date.today() + timedelta(days=7),
                'video_url': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'description': '## Первая космическая скорость\n\n$v_1 = \\sqrt{\\frac{GM}{R}}$',
                'is_published': True,
            },
        )
        block2, _ = Block.objects.get_or_create(
            course=course, order=2,
            defaults={'title': 'Звёздное небо', 'description': 'Созвездия, звёздные величины, координаты.'},
        )
        topic2_1, _ = Topic.objects.get_or_create(
            block=block2, order=1,
            defaults={'title': 'Звёздные величины', 'description': 'Система звёздных величин и формула Погсона.'},
        )
        lesson2_1_1, _ = Lesson.objects.get_or_create(
            topic=topic2_1, order=1,
            defaults={
                'title': 'Формула Погсона',
                'lesson_date': date.today() + timedelta(days=14),
                'video_url': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'description': '## Формула Погсона\n\n$m_1 - m_2 = -2.5 \\lg \\frac{E_1}{E_2}$',
                'is_published': True,
            },
        )
        lesson2_1_2, _ = Lesson.objects.get_or_create(
            topic=topic2_1, order=2,
            defaults={
                'title': 'Абсолютная звёздная величина',
                'lesson_date': date.today() + timedelta(days=21),
                'video_url': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'description': '## Абсолютная звёздная величина\n\n$M = m - 5 \\lg r + 5$',
                'is_published': True,
            },
        )
        topic2_2, _ = Topic.objects.get_or_create(
            block=block2, order=2,
            defaults={'title': 'Небесные координаты', 'description': 'Горизонтальная и экваториальная системы координат.'},
        )
        lesson2_2_1, _ = Lesson.objects.get_or_create(
            topic=topic2_2, order=1,
            defaults={
                'title': 'Горизонтальная система координат',
                'lesson_date': date.today() + timedelta(days=28),
                'video_url': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'description': 'Азимут и высота.',
                'is_published': True,
            },
        )
        lesson2_2_2, _ = Lesson.objects.get_or_create(
            topic=topic2_2, order=2,
            defaults={
                'title': 'Экваториальная система координат',
                'lesson_date': date.today() + timedelta(days=35),
                'video_url': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'description': 'Прямое восхождение и склонение.',
                'is_published': True,
            },
        )

        # ---- Lesson types ----
        lesson_types = {
            lesson1_1_1.id: 'theory', lesson1_1_2.id: 'practice',
            lesson1_2_1.id: 'theory', lesson1_2_2.id: 'hard',
            lesson2_1_1.id: 'theory', lesson2_1_2.id: 'practice',
            lesson2_2_1.id: 'theory', lesson2_2_2.id: 'test',
        }
        for lid, lt in lesson_types.items():
            Lesson.objects.filter(id=lid).update(lesson_type=lt)

        # ---- Lesson materials (real downloadable PDFs) ----
        materials_spec = [
            (lesson1_1_1, 'Конспект: законы Кеплера', 'notes'),
            (lesson1_1_1, 'Карта звёздного неба (осень)', 'starmap'),
            (lesson1_1_2, 'Формулы: третий закон Кеплера', 'formulas'),
            (lesson1_2_1, 'Подборка задач: гравитация', 'problems'),
            (lesson2_1_1, 'Конспект: звёздные величины', 'notes'),
        ]
        for lesson, title, kind in materials_spec:
            if not LessonMaterial.objects.filter(lesson=lesson, title=title).exists():
                m = LessonMaterial(lesson=lesson, title=title, kind=kind, order=0)
                fname = f'{slugify(title) or "material"}.pdf'
                m.file.save(fname, ContentFile(_minimal_pdf(f'Apeks: {kind}')), save=False)
                m.save()

        # ---- Homework (lesson 1_1_2) with due date + 4 problem types ----
        hw, _ = Homework.objects.get_or_create(
            lesson=lesson1_1_2, defaults={'title': 'ДЗ: Третий закон Кеплера'},
        )
        if hw.due_date is None:
            hw.due_date = timezone.now() + timedelta(days=3)
            hw.save()

        p1, _ = Problem.objects.get_or_create(
            homework=hw, order=1,
            defaults={
                'title': 'Физический смысл третьего закона',
                'statement': 'Объясните физический смысл третьего закона Кеплера. Почему отношение $\\frac{T^2}{a^3}$ одинаково для всех планет Солнечной системы?',
                'answer_type': 'text', 'max_score': 3,
                'hint': 'Подумайте о том, какая величина определяет это отношение.',
                'solution': 'Отношение $\\frac{T^2}{a^3} = \\frac{4\\pi^2}{G M_\\odot}$ зависит только от массы центрального тела (Солнца) и гравитационной постоянной, поэтому одинаково для всех планет.',
                'level': 'school',
            },
        )
        p2, _ = Problem.objects.get_or_create(
            homework=hw, order=2,
            defaults={
                'title': 'Большая полуось орбиты Марса',
                'statement': 'Период обращения Марса вокруг Солнца примерно равен 1.88 года. Чему примерно равна большая полуось орбиты Марса в а.е.?',
                'answer_type': 'choice_single', 'correct_answer': None, 'max_score': 2,
                'solution': 'По третьему закону $a = T^{2/3} = 1.88^{2/3} \\approx 1.52$ а.е.',
                'level': 'school',
            },
        )
        ProblemOption.objects.get_or_create(problem=p2, order=1, defaults={'text': '1.2 а.е.', 'is_correct': False})
        opt_b, _ = ProblemOption.objects.get_or_create(problem=p2, order=2, defaults={'text': '1.52 а.е.', 'is_correct': True})
        ProblemOption.objects.get_or_create(problem=p2, order=3, defaults={'text': '2.0 а.е.', 'is_correct': False})
        ProblemOption.objects.get_or_create(problem=p2, order=4, defaults={'text': '1.88 а.е.', 'is_correct': False})
        if not p2.correct_answer:
            p2.correct_answer = {'correct_option_id': str(opt_b.id)}
            p2.save()

        p3, _ = Problem.objects.get_or_create(
            homework=hw, order=3,
            defaults={
                'title': 'Орбита Европы',
                'statement': 'Период обращения спутника Юпитера Ио составляет 1.77 суток, а Европы — 3.55 суток. Большая полуось орбиты Ио равна 421 700 км. Найдите большую полуось орбиты Европы (в тыс. км). Ответ округлите до целого.',
                'answer_type': 'number',
                'correct_answer': {'value': 671, 'tolerance_type': 'abs', 'tolerance': 5},
                'max_score': 3,
                'hint': 'Используйте третий закон Кеплера: $\\frac{T_1^2}{T_2^2} = \\frac{a_1^3}{a_2^3}$',
                'solution': '$a_2 = a_1 \\left(\\frac{T_2}{T_1}\\right)^{2/3} = 421.7 \\cdot (3.55/1.77)^{2/3} \\approx 671$ тыс. км.',
                'level': 'municipal',
            },
        )
        p4, _ = Problem.objects.get_or_create(
            homework=hw, order=4,
            defaults={
                'title': 'Обобщённый третий закон',
                'statement': 'Запишите третий закон Кеплера в обобщённой форме (с учётом масс тел) через период $T$, большую полуось $a$, гравитационную постоянную $G$ и массы тел $M$ и $m$.',
                'answer_type': 'formula',
                'correct_answer': {'latex': 'T^2 = \\frac{4\\pi^2 a^3}{G(M+m)}'},
                'max_score': 4,
                'hint': 'Вспомните, как связаны сила тяготения и центростремительное ускорение.',
                'solution': 'Приравнивая силу тяготения к центростремительной для двух тел вокруг общего центра масс, получаем $T^2 = \\frac{4\\pi^2 a^3}{G(M+m)}$.',
                'level': 'regional',
            },
        )
        # tag the homework problems
        p1.tags.add(tags['Законы Кеплера'])
        p2.tags.add(tags['Законы Кеплера'])
        p3.tags.add(tags['Законы Кеплера'])
        p4.tags.add(tags['Законы Кеплера'], tags['Гравитация'])

        # ---- Problem bank (standalone problems, homework=None, in_bank=True) ----
        bank_spec = [
            {
                'title': 'Видимая звёздная величина',
                'statement': 'Звезда A в 100 раз ярче звезды B. На сколько звёздных величин они отличаются?',
                'answer_type': 'number', 'correct_answer': {'value': 5, 'tolerance_type': 'abs', 'tolerance': 0.1},
                'max_score': 2, 'level': 'school',
                'solution': '$\\Delta m = -2.5\\lg 100 = -5$, то есть на 5 звёздных величин.',
                'tags': ['Звёздные величины', 'Формула Погсона'],
            },
            {
                'title': 'Первая космическая скорость Земли',
                'statement': 'Найдите первую космическую скорость у поверхности Земли (км/с). $g=9.8$ м/с², $R=6371$ км.',
                'answer_type': 'number', 'correct_answer': {'value': 7.9, 'tolerance_type': 'abs', 'tolerance': 0.2},
                'max_score': 3, 'level': 'municipal',
                'solution': '$v_1 = \\sqrt{gR} = \\sqrt{9.8 \\cdot 6.371\\cdot10^6} \\approx 7.9$ км/с.',
                'tags': ['Космические скорости', 'Гравитация'],
            },
            {
                'title': 'Параллакс и расстояние',
                'statement': 'Годичный параллакс звезды равен 0.1″. Чему равно расстояние до неё в парсеках?',
                'answer_type': 'number', 'correct_answer': {'value': 10, 'tolerance_type': 'abs', 'tolerance': 0.1},
                'max_score': 2, 'level': 'school',
                'solution': '$r = 1/\\pi = 1/0.1 = 10$ пк.',
                'tags': ['Параллакс'],
            },
            {
                'title': 'Наклон эклиптики',
                'statement': 'Чему примерно равен наклон эклиптики к небесному экватору (в градусах)?',
                'answer_type': 'number', 'correct_answer': {'value': 23.4, 'tolerance_type': 'abs', 'tolerance': 0.5},
                'max_score': 1, 'level': 'school',
                'solution': 'Наклон эклиптики $\\varepsilon \\approx 23.4°$.',
                'tags': ['Эклиптика', 'Небесные координаты'],
            },
            {
                'title': 'Абсолютная величина Солнца',
                'statement': 'Видимая звёздная величина Солнца $m=-26.7$, расстояние 1 а.е. Найдите абсолютную звёздную величину Солнца. (1 пк = 206265 а.е.)',
                'answer_type': 'number', 'correct_answer': {'value': 4.8, 'tolerance_type': 'abs', 'tolerance': 0.2},
                'max_score': 4, 'level': 'regional',
                'solution': '$M = m - 5\\lg r + 5$, где $r$ в пк. $r = 1/206265$ пк, $M = -26.7 - 5\\lg(1/206265)+5 \\approx 4.8$.',
                'tags': ['Звёздные величины', 'Формула Погсона'],
            },
            {
                'title': 'Третий закон для экзопланеты',
                'statement': 'Запишите третий закон Кеплера, связывающий период $T$ и большую полуось $a$ при массе звезды $M$ (массой планеты пренебречь).',
                'answer_type': 'formula', 'correct_answer': {'latex': 'T^2 = \\frac{4\\pi^2 a^3}{G M}'},
                'max_score': 3, 'level': 'municipal',
                'solution': 'При $m \\ll M$: $T^2 = \\frac{4\\pi^2 a^3}{GM}$.',
                'tags': ['Законы Кеплера', 'Гравитация'],
            },
            {
                'title': 'Кульминация светила',
                'statement': 'На широте $\\varphi=55°$ светило имеет склонение $\\delta=10°$. Найдите высоту светила в верхней кульминации (в градусах).',
                'answer_type': 'number', 'correct_answer': {'value': 45, 'tolerance_type': 'abs', 'tolerance': 0.5},
                'max_score': 3, 'level': 'regional',
                'solution': '$h = 90° - \\varphi + \\delta = 90 - 55 + 10 = 45°$.',
                'tags': ['Небесные координаты'],
            },
            {
                'title': 'Вторая космическая скорость',
                'statement': 'Во сколько раз вторая космическая скорость больше первой для одного и того же тела? Ответ округлите до сотых.',
                'answer_type': 'number', 'correct_answer': {'value': 1.41, 'tolerance_type': 'abs', 'tolerance': 0.02},
                'max_score': 2, 'level': 'school',
                'solution': '$v_2/v_1 = \\sqrt{2} \\approx 1.41$.',
                'tags': ['Космические скорости'],
            },
            {
                'title': 'Финал: возмущения орбиты',
                'statement': 'Объясните качественно, почему перигелий Меркурия медленно прецессирует, и какой вклад даёт ОТО.',
                'answer_type': 'text', 'max_score': 5, 'level': 'final',
                'solution': 'Основной вклад дают возмущения от других планет; остаточные 43″/век объясняются общей теорией относительности (искривление пространства-времени вблизи Солнца).',
                'tags': ['Гравитация', 'Законы Кеплера'],
            },
        ]
        bank_problems = []
        for spec in bank_spec:
            tnames = spec.pop('tags', [])
            p, _ = Problem.objects.get_or_create(
                homework=None, title=spec['title'],
                defaults={**spec, 'in_bank': True, 'order': 0},
            )
            if not p.in_bank:
                p.in_bank = True
                p.save()
            for tn in tnames:
                p.tags.add(tags[tn])
            bank_problems.append(p)

        # ---- Sample submissions (so stats / mistakes / recommendations have data) ----
        def ensure_submission(user, problem, answer):
            if Submission.objects.filter(user=user, problem=problem).exists():
                return
            res = grade_answer(problem, answer)
            Submission.objects.create(
                user=user, problem=problem, answer=answer,
                is_auto_checked=res['is_auto_checked'], is_correct=res['is_correct'],
                score=res['score'],
                checked_at=timezone.now() if res['is_auto_checked'] else None,
            )

        # student1: a few correct, one wrong (creates a "mistake")
        ensure_submission(student1, p2, {'option_id': str(opt_b.id)})            # correct
        ensure_submission(student1, p3, {'value': 650})                          # wrong (correct 671)
        ensure_submission(student1, bank_problems[0], {'value': 5})              # correct (magnitudes)
        ensure_submission(student1, bank_problems[2], {'value': 12})             # wrong (parallax, correct 10)
        ensure_submission(student1, bank_problems[7], {'value': 1.41})           # correct
        # student2: different pattern
        ensure_submission(student2, p3, {'value': 671})                          # correct
        ensure_submission(student2, bank_problems[1], {'value': 6.0})            # wrong (first cosmic, correct 7.9)

        # mark some lessons watched for student1
        for lesson in [lesson1_1_1, lesson1_1_2]:
            lp, _ = LessonProgress.objects.get_or_create(user=student1, lesson=lesson)
            if not lp.is_watched:
                lp.is_watched = True
                lp.watched_at = timezone.now()
                lp.save()

        # ---- Mock olympiad (timed) ----
        mock, _ = MockOlympiad.objects.get_or_create(
            title='Пробный школьный тур по астрономии',
            defaults={
                'description': 'Тренировочный тур в формате школьного этапа ВсОШ. 5 задач, 45 минут.',
                'level': 'school', 'duration_minutes': 45, 'is_published': True,
            },
        )
        mock_problem_pool = [p2, p3, bank_problems[0], bank_problems[2], bank_problems[7]]
        for i, prob in enumerate(mock_problem_pool, start=1):
            MockProblem.objects.get_or_create(mock=mock, problem=prob, defaults={'order': i})

        mock2, _ = MockOlympiad.objects.get_or_create(
            title='Пробный региональный тур',
            defaults={
                'description': 'Сложный тренировочный тур уровня регионального этапа. 4 задачи, 90 минут.',
                'level': 'regional', 'duration_minutes': 90, 'is_published': True,
            },
        )
        for i, prob in enumerate([p4, bank_problems[4], bank_problems[5], bank_problems[6]], start=1):
            MockProblem.objects.get_or_create(mock=mock2, problem=prob, defaults={'order': i})

        # ---- Engagement: ratings, favorites, questions ----
        LessonRating.objects.get_or_create(
            user=student1, lesson=lesson1_1_1,
            defaults={'rating': 5, 'comment': 'Очень понятно объяснили законы Кеплера!'},
        )
        LessonRating.objects.get_or_create(
            user=student2, lesson=lesson1_1_1,
            defaults={'rating': 4, 'comment': 'Хорошо, но хотелось бы больше задач.'},
        )
        Favorite.objects.get_or_create(user=student1, lesson=lesson1_2_2)
        Favorite.objects.get_or_create(user=student1, problem=bank_problems[4])

        Question.objects.get_or_create(
            user=student1, lesson=lesson1_1_2,
            defaults={'text': 'А как применить третий закон, если массы тел сравнимы?'},
        )
        q_answered, qa_created = Question.objects.get_or_create(
            user=student1, problem=p3,
            defaults={'text': 'Почему в ответе тысячи километров, а не метры?'},
        )
        if qa_created or not q_answered.is_answered:
            q_answered.answer = 'Потому что в условии большая полуось Ио дана в км; ответ просят в тыс. км для удобства.'
            q_answered.answered_by = admin
            q_answered.answered_at = timezone.now()
            q_answered.is_answered = True
            q_answered.save()

        # ---- Calendar events ----
        today = date.today()
        et_school, _ = OlympiadEventType.objects.get_or_create(name='Школьный этап', defaults={'color': '#10B981'})
        et_muni, _ = OlympiadEventType.objects.get_or_create(name='Муниципальный этап', defaults={'color': '#3B82F6'})
        et_region, _ = OlympiadEventType.objects.get_or_create(name='Региональный этап', defaults={'color': '#8B5CF6'})
        et_final, _ = OlympiadEventType.objects.get_or_create(name='Заключительный этап', defaults={'color': '#EF4444'})
        et_struve, _ = OlympiadEventType.objects.get_or_create(name='Турнир Струве', defaults={'color': '#F59E0B'})
        et_open, _ = OlympiadEventType.objects.get_or_create(name='Открытая олимпиада', defaults={'color': '#06B6D4'})
        et_deadline, _ = OlympiadEventType.objects.get_or_create(name='Дедлайн регистрации', defaults={'color': '#EC4899'})
        OlympiadEventType.objects.get_or_create(name='Другое', defaults={'color': '#6B7280'})

        OlympiadEvent.objects.get_or_create(
            title='Школьный этап ВсОШ по астрономии',
            defaults={'event_type': et_school, 'start_date': today + timedelta(days=30),
                      'description': 'Школьный этап Всероссийской олимпиады школьников по астрономии.',
                      'external_url': 'https://vserosolimp.edsoo.ru/'},
        )
        OlympiadEvent.objects.get_or_create(
            title='Муниципальный этап ВсОШ',
            defaults={'event_type': et_muni, 'start_date': today + timedelta(days=60),
                      'end_date': today + timedelta(days=61), 'description': 'Муниципальный этап ВсОШ по астрономии.'},
        )
        OlympiadEvent.objects.get_or_create(
            title='Турнир Струве — регистрация',
            defaults={'event_type': et_deadline, 'start_date': today + timedelta(days=15),
                      'description': 'Дедлайн регистрации на Турнир Струве.', 'external_url': 'https://struve.org/'},
        )
        OlympiadEvent.objects.get_or_create(
            title='Турнир Струве — отборочный тур',
            defaults={'event_type': et_struve, 'start_date': today + timedelta(days=45),
                      'end_date': today + timedelta(days=46), 'description': 'Отборочный тур Турнира Струве.'},
        )
        OlympiadEvent.objects.get_or_create(
            title='Открытая олимпиада по астрономии СПбГУ',
            defaults={'event_type': et_open, 'start_date': today + timedelta(days=90),
                      'description': 'Открытая олимпиада по астрономии СПбГУ.', 'external_url': 'https://olymp.spbu.ru/'},
        )

        self.stdout.write(self.style.SUCCESS('Database seeded successfully!'))
        self.stdout.write('')
        self.stdout.write('Test accounts:')
        self.stdout.write('  Admin: admin@apeks.space / admin123')
        self.stdout.write('  Student 1: student1@test.com / student123')
        self.stdout.write('  Student 2: student2@test.com / student123')
