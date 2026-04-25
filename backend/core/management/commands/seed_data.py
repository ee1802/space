from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import date, timedelta
from core.models import User
from courses.models import Course, Enrollment, Block, Topic, Lesson
from homework.models import Homework, Problem, ProblemOption
from calendar_app.models import OlympiadEventType, OlympiadEvent


class Command(BaseCommand):
    help = 'Seed database with test data'

    def handle(self, *args, **options):
        self.stdout.write('Seeding database...')

        # Create admin
        admin, created = User.objects.get_or_create(
            email='admin@apeks.space',
            defaults={
                'full_name': 'Евгений Бойцов',
                'telegram_username': '@eugene_boitsov',
                'is_admin': True,
                'is_staff': True,
                'is_superuser': True,
                'is_email_verified': True,
            }
        )
        if created:
            admin.set_password('admin123')
            admin.save()
            self.stdout.write(f'  Created admin: {admin.email} / admin123')

        # Create students
        student1, created = User.objects.get_or_create(
            email='student1@test.com',
            defaults={
                'full_name': 'Иван Петров',
                'telegram_username': '@ivan_petrov',
                'is_email_verified': True,
            }
        )
        if created:
            student1.set_password('student123')
            student1.save()
            self.stdout.write(f'  Created student: {student1.email} / student123')

        student2, created = User.objects.get_or_create(
            email='student2@test.com',
            defaults={
                'full_name': 'Мария Сидорова',
                'telegram_username': '@maria_sid',
                'is_email_verified': True,
            }
        )
        if created:
            student2.set_password('student123')
            student2.save()
            self.stdout.write(f'  Created student: {student2.email} / student123')

        # Create course
        course, _ = Course.objects.get_or_create(
            slug='vseros-s-apeksom',
            defaults={
                'title': 'Всерос с Апексом',
                'description': 'Годовой курс подготовки к ВсОШ по астрономии. 12 пар в неделю: астрономия старшего и младшего потока, физика и математика для астрономов, звёздное небо.',
                'is_published': True,
            }
        )
        self.stdout.write(f'  Course: {course.title}')

        # Enroll students
        Enrollment.objects.get_or_create(user=student1, course=course)
        Enrollment.objects.get_or_create(user=student2, course=course)

        # Block 1
        block1, _ = Block.objects.get_or_create(
            course=course, order=1,
            defaults={'title': 'Небесная механика', 'description': 'Основы небесной механики и орбитального движения.'}
        )

        topic1_1, _ = Topic.objects.get_or_create(
            block=block1, order=1,
            defaults={'title': 'Законы Кеплера', 'description': 'Три закона Кеплера и их применение.'}
        )
        lesson1_1_1, _ = Lesson.objects.get_or_create(
            topic=topic1_1, order=1,
            defaults={
                'title': 'Первый и второй законы Кеплера',
                'lesson_date': date.today() - timedelta(days=14),
                'video_url': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'description': '## Первый закон Кеплера\n\nОрбита каждой планеты есть эллипс, в одном из фокусов которого находится Солнце.\n\n## Второй закон Кеплера\n\nРадиус-вектор планеты за равные промежутки времени описывает равные площади.',
                'is_published': True,
            }
        )
        lesson1_1_2, _ = Lesson.objects.get_or_create(
            topic=topic1_1, order=2,
            defaults={
                'title': 'Третий закон Кеплера',
                'lesson_date': date.today() - timedelta(days=7),
                'video_url': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'description': '## Третий закон Кеплера\n\n$\\frac{T_1^2}{T_2^2} = \\frac{a_1^3}{a_2^3}$\n\nОтношение квадратов периодов обращения планет равно отношению кубов больших полуосей их орбит.',
                'is_published': True,
            }
        )

        topic1_2, _ = Topic.objects.get_or_create(
            block=block1, order=2,
            defaults={'title': 'Гравитация', 'description': 'Закон всемирного тяготения и его следствия.'}
        )
        lesson1_2_1, _ = Lesson.objects.get_or_create(
            topic=topic1_2, order=1,
            defaults={
                'title': 'Закон всемирного тяготения',
                'lesson_date': date.today(),
                'video_url': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'description': '## Закон всемирного тяготения\n\n$F = G \\frac{m_1 m_2}{r^2}$',
                'is_published': True,
            }
        )
        lesson1_2_2, _ = Lesson.objects.get_or_create(
            topic=topic1_2, order=2,
            defaults={
                'title': 'Космические скорости',
                'lesson_date': date.today() + timedelta(days=7),
                'video_url': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'description': '## Первая космическая скорость\n\n$v_1 = \\sqrt{\\frac{GM}{R}}$',
                'is_published': True,
            }
        )

        # Block 2
        block2, _ = Block.objects.get_or_create(
            course=course, order=2,
            defaults={'title': 'Звёздное небо', 'description': 'Созвездия, звёздные величины, координаты.'}
        )

        topic2_1, _ = Topic.objects.get_or_create(
            block=block2, order=1,
            defaults={'title': 'Звёздные величины', 'description': 'Система звёздных величин и формула Погсона.'}
        )
        lesson2_1_1, _ = Lesson.objects.get_or_create(
            topic=topic2_1, order=1,
            defaults={
                'title': 'Формула Погсона',
                'lesson_date': date.today() + timedelta(days=14),
                'video_url': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'description': '## Формула Погсона\n\n$m_1 - m_2 = -2.5 \\lg \\frac{E_1}{E_2}$',
                'is_published': True,
            }
        )
        lesson2_1_2, _ = Lesson.objects.get_or_create(
            topic=topic2_1, order=2,
            defaults={
                'title': 'Абсолютная звёздная величина',
                'lesson_date': date.today() + timedelta(days=21),
                'video_url': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'description': '## Абсолютная звёздная величина\n\n$M = m - 5 \\lg r + 5$',
                'is_published': True,
            }
        )

        topic2_2, _ = Topic.objects.get_or_create(
            block=block2, order=2,
            defaults={'title': 'Небесные координаты', 'description': 'Горизонтальная и экваториальная системы координат.'}
        )
        lesson2_2_1, _ = Lesson.objects.get_or_create(
            topic=topic2_2, order=1,
            defaults={
                'title': 'Горизонтальная система координат',
                'lesson_date': date.today() + timedelta(days=28),
                'video_url': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'description': 'Азимут и высота.',
                'is_published': True,
            }
        )
        lesson2_2_2, _ = Lesson.objects.get_or_create(
            topic=topic2_2, order=2,
            defaults={
                'title': 'Экваториальная система координат',
                'lesson_date': date.today() + timedelta(days=35),
                'video_url': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'description': 'Прямое восхождение и склонение.',
                'is_published': True,
            }
        )

        # Homework for lesson 1_1_2 (Third law of Kepler) with 4 problem types
        hw, _ = Homework.objects.get_or_create(
            lesson=lesson1_1_2,
            defaults={'title': 'ДЗ: Третий закон Кеплера'}
        )

        # Problem 1: text
        p1, _ = Problem.objects.get_or_create(
            homework=hw, order=1,
            defaults={
                'statement': 'Объясните физический смысл третьего закона Кеплера. Почему отношение $\\frac{T^2}{a^3}$ одинаково для всех планет Солнечной системы?',
                'answer_type': 'text',
                'max_score': 3,
                'hint': 'Подумайте о том, какая величина определяет это отношение.',
            }
        )

        # Problem 2: choice_single
        p2, _ = Problem.objects.get_or_create(
            homework=hw, order=2,
            defaults={
                'statement': 'Период обращения Марса вокруг Солнца примерно равен 1.88 года. Чему примерно равна большая полуось орбиты Марса в а.е.?',
                'answer_type': 'choice_single',
                'correct_answer': None,
                'max_score': 2,
            }
        )
        opt_a, _ = ProblemOption.objects.get_or_create(problem=p2, order=1, defaults={'text': '1.2 а.е.', 'is_correct': False})
        opt_b, _ = ProblemOption.objects.get_or_create(problem=p2, order=2, defaults={'text': '1.52 а.е.', 'is_correct': True})
        opt_c, _ = ProblemOption.objects.get_or_create(problem=p2, order=3, defaults={'text': '2.0 а.е.', 'is_correct': False})
        opt_d, _ = ProblemOption.objects.get_or_create(problem=p2, order=4, defaults={'text': '1.88 а.е.', 'is_correct': False})
        # Update correct_answer
        p2.correct_answer = {'correct_option_id': str(opt_b.id)}
        p2.save()

        # Problem 3: number
        p3, _ = Problem.objects.get_or_create(
            homework=hw, order=3,
            defaults={
                'statement': 'Период обращения спутника Юпитера Ио составляет 1.77 суток, а Европы — 3.55 суток. Большая полуось орбиты Ио равна 421 700 км. Найдите большую полуось орбиты Европы (в тыс. км). Ответ округлите до целого.',
                'answer_type': 'number',
                'correct_answer': {'value': 671, 'tolerance_type': 'abs', 'tolerance': 5},
                'max_score': 3,
                'hint': 'Используйте третий закон Кеплера: $\\frac{T_1^2}{T_2^2} = \\frac{a_1^3}{a_2^3}$',
            }
        )

        # Problem 4: formula
        p4, _ = Problem.objects.get_or_create(
            homework=hw, order=4,
            defaults={
                'statement': 'Запишите третий закон Кеплера в обобщённой форме (с учётом масс тел) через период $T$, большую полуось $a$, гравитационную постоянную $G$ и массы тел $M$ и $m$.',
                'answer_type': 'formula',
                'correct_answer': {'latex': 'T^2 = \\frac{4\\pi^2 a^3}{G(M+m)}'},
                'max_score': 4,
                'hint': 'Вспомните, как связаны сила тяготения и центростремительное ускорение.',
            }
        )

        # Calendar events
        today = date.today()

        et_school, _ = OlympiadEventType.objects.get_or_create(name='Школьный этап', defaults={'color': '#10B981'})
        et_muni, _ = OlympiadEventType.objects.get_or_create(name='Муниципальный этап', defaults={'color': '#3B82F6'})
        et_region, _ = OlympiadEventType.objects.get_or_create(name='Региональный этап', defaults={'color': '#8B5CF6'})
        et_final, _ = OlympiadEventType.objects.get_or_create(name='Заключительный этап', defaults={'color': '#EF4444'})
        et_struve, _ = OlympiadEventType.objects.get_or_create(name='Турнир Струве', defaults={'color': '#F59E0B'})
        et_open, _ = OlympiadEventType.objects.get_or_create(name='Открытая олимпиада', defaults={'color': '#06B6D4'})
        et_deadline, _ = OlympiadEventType.objects.get_or_create(name='Дедлайн регистрации', defaults={'color': '#EC4899'})
        et_other, _ = OlympiadEventType.objects.get_or_create(name='Другое', defaults={'color': '#6B7280'})

        OlympiadEvent.objects.get_or_create(
            title='Школьный этап ВсОШ по астрономии',
            defaults={
                'event_type': et_school,
                'start_date': today + timedelta(days=30),
                'description': 'Школьный этап Всероссийской олимпиады школьников по астрономии.',
                'external_url': 'https://vserosolimp.edsoo.ru/',
            }
        )
        OlympiadEvent.objects.get_or_create(
            title='Муниципальный этап ВсОШ',
            defaults={
                'event_type': et_muni,
                'start_date': today + timedelta(days=60),
                'end_date': today + timedelta(days=61),
                'description': 'Муниципальный этап ВсОШ по астрономии.',
            }
        )
        OlympiadEvent.objects.get_or_create(
            title='Турнир Струве — регистрация',
            defaults={
                'event_type': et_deadline,
                'start_date': today + timedelta(days=15),
                'description': 'Дедлайн регистрации на Турнир Струве.',
                'external_url': 'https://struve.org/',
            }
        )
        OlympiadEvent.objects.get_or_create(
            title='Турнир Струве — отборочный тур',
            defaults={
                'event_type': et_struve,
                'start_date': today + timedelta(days=45),
                'end_date': today + timedelta(days=46),
                'description': 'Отборочный тур Турнира Струве.',
            }
        )
        OlympiadEvent.objects.get_or_create(
            title='Открытая олимпиада по астрономии СПбГУ',
            defaults={
                'event_type': et_open,
                'start_date': today + timedelta(days=90),
                'description': 'Открытая олимпиада по астрономии Санкт-Петербургского государственного университета.',
                'external_url': 'https://olymp.spbu.ru/',
            }
        )

        self.stdout.write(self.style.SUCCESS('Database seeded successfully!'))
        self.stdout.write('')
        self.stdout.write('Test accounts:')
        self.stdout.write(f'  Admin: admin@apeks.space / admin123')
        self.stdout.write(f'  Student 1: student1@test.com / student123')
        self.stdout.write(f'  Student 2: student2@test.com / student123')
