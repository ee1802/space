from django.conf import settings
from django.db import models


class Course(models.Model):
    title = models.CharField('Название', max_length=255)
    slug = models.SlugField('Слаг (URL)', unique=True, max_length=255)
    description = models.TextField('Описание', blank=True, default='')
    cover_image = models.ImageField('Обложка', upload_to='courses/covers/', blank=True, null=True)
    is_published = models.BooleanField('Опубликован', default=False)
    created_at = models.DateTimeField('Создан', auto_now_add=True)
    updated_at = models.DateTimeField('Обновлён', auto_now=True)

    class Meta:
        db_table = 'courses'
        ordering = ['-updated_at']
        verbose_name = 'Курс'
        verbose_name_plural = 'Курсы'

    def __str__(self):
        return self.title


class Enrollment(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='enrollments',
                             verbose_name='Пользователь')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments',
                               verbose_name='Курс')
    granted_at = models.DateTimeField('Доступ выдан', auto_now_add=True)
    manual_progress_override = models.IntegerField('Ручной прогресс (0-100)', null=True, blank=True,
                                                    help_text='Manual progress override 0-100')
    created_at = models.DateTimeField('Создан', auto_now_add=True)
    updated_at = models.DateTimeField('Обновлён', auto_now=True)

    class Meta:
        db_table = 'enrollments'
        unique_together = ['user', 'course']
        verbose_name = 'Доступ к курсу'
        verbose_name_plural = 'Доступы к курсам'

    def __str__(self):
        return f'{self.user} -> {self.course}'


class Block(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='blocks',
                               verbose_name='Курс')
    title = models.CharField('Название', max_length=255)
    description = models.TextField('Описание', blank=True, default='')
    order = models.IntegerField('Порядок', default=0)
    created_at = models.DateTimeField('Создан', auto_now_add=True)
    updated_at = models.DateTimeField('Обновлён', auto_now=True)

    class Meta:
        db_table = 'blocks'
        ordering = ['order']
        verbose_name = 'Блок'
        verbose_name_plural = 'Блоки'

    def __str__(self):
        return self.title


class Topic(models.Model):
    block = models.ForeignKey(Block, on_delete=models.CASCADE, related_name='topics',
                              verbose_name='Блок')
    title = models.CharField('Название', max_length=255)
    description = models.TextField('Описание', blank=True, default='')
    order = models.IntegerField('Порядок', default=0)
    created_at = models.DateTimeField('Создан', auto_now_add=True)
    updated_at = models.DateTimeField('Обновлён', auto_now=True)

    class Meta:
        db_table = 'topics'
        ordering = ['order']
        verbose_name = 'Тема'
        verbose_name_plural = 'Темы'

    def __str__(self):
        return self.title


class Lesson(models.Model):
    VIDEO_PROVIDERS = [
        ('youtube', 'YouTube'),
        ('vk', 'VK Video'),
        ('yandex', 'Yandex Disk'),
    ]

    LESSON_TYPES = [
        ('theory', 'Теория'),
        ('practice', 'Практика'),
        ('hard', 'Сложные задачи'),
        ('test', 'Тест'),
        ('mock', 'Пробник'),
    ]

    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, related_name='lessons',
                              verbose_name='Тема')
    title = models.CharField('Название', max_length=255)
    lesson_type = models.CharField('Тип урока', max_length=20, choices=LESSON_TYPES, default='theory')
    lesson_date = models.DateField('Дата урока', null=True, blank=True)
    video_provider = models.CharField('Видео-хостинг', max_length=20, choices=VIDEO_PROVIDERS, default='youtube')
    video_url = models.URLField('Ссылка на видео', blank=True, default='')
    description = models.TextField('Описание', blank=True, default='')
    notes_file = models.FileField('Конспект (файл)', upload_to='lessons/notes/', blank=True, null=True)
    workbook_file = models.FileField('Рабочая тетрадь', upload_to='lessons/workbooks/', blank=True, null=True)
    is_published = models.BooleanField('Опубликован', default=False)
    order = models.IntegerField('Порядок', default=0)
    created_at = models.DateTimeField('Создан', auto_now_add=True)
    updated_at = models.DateTimeField('Обновлён', auto_now=True)

    class Meta:
        db_table = 'lessons'
        ordering = ['order']
        verbose_name = 'Урок'
        verbose_name_plural = 'Уроки'

    def __str__(self):
        return self.title


class LessonMaterial(models.Model):
    """A downloadable material attached to a lesson (PDF конспект, формулы, карта неба...)."""
    KINDS = [
        ('notes', 'Конспект'),
        ('formulas', 'Формулы'),
        ('starmap', 'Карта звёздного неба'),
        ('problems', 'Подборка задач'),
        ('other', 'Другое'),
    ]
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='materials',
                               verbose_name='Урок')
    title = models.CharField('Название', max_length=255)
    kind = models.CharField('Тип материала', max_length=20, choices=KINDS, default='notes')
    file = models.FileField('Файл', upload_to='lessons/materials/')
    order = models.IntegerField('Порядок', default=0)
    created_at = models.DateTimeField('Создан', auto_now_add=True)

    class Meta:
        db_table = 'lesson_materials'
        ordering = ['order']
        verbose_name = 'Материал урока'
        verbose_name_plural = 'Материалы уроков'

    def __str__(self):
        return f'{self.title} ({self.lesson})'


class LessonProgress(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='lesson_progress',
                             verbose_name='Пользователь')
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='progress',
                               verbose_name='Урок')
    is_watched = models.BooleanField('Просмотрен', default=False)
    watched_at = models.DateTimeField('Дата просмотра', null=True, blank=True)
    created_at = models.DateTimeField('Создан', auto_now_add=True)
    updated_at = models.DateTimeField('Обновлён', auto_now=True)

    class Meta:
        db_table = 'lesson_progress'
        unique_together = ['user', 'lesson']
        verbose_name = 'Прогресс по уроку'
        verbose_name_plural = 'Прогресс по урокам'

    def __str__(self):
        return f'{self.user} - {self.lesson} - {"watched" if self.is_watched else "not watched"}'
