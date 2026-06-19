from django.conf import settings
from django.db import models


class Homework(models.Model):
    lesson = models.OneToOneField('courses.Lesson', on_delete=models.CASCADE, related_name='homework',
                                  verbose_name='Урок')
    title = models.CharField(max_length=255, blank=True, default='', verbose_name='Название')
    due_date = models.DateTimeField(null=True, blank=True, help_text='Дедлайн сдачи', verbose_name='Дедлайн')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создано')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Обновлено')

    class Meta:
        db_table = 'homeworks'
        verbose_name = 'Домашнее задание'
        verbose_name_plural = 'Домашние задания'

    def __str__(self):
        return self.title or f'ДЗ к {self.lesson.title}'


class Tag(models.Model):
    """A topic tag for problems (e.g. «Законы Кеплера», «Параллакс»)."""
    name = models.CharField(max_length=100, unique=True, verbose_name='Название')
    slug = models.SlugField(max_length=120, unique=True, verbose_name='Слаг')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создано')

    class Meta:
        db_table = 'tags'
        ordering = ['name']
        verbose_name = 'Тег'
        verbose_name_plural = 'Теги'

    def __str__(self):
        return self.name


class Problem(models.Model):
    ANSWER_TYPES = [
        ('text', 'Текстовый ответ'),
        ('choice_single', 'Один вариант'),
        ('choice_multiple', 'Несколько вариантов'),
        ('number', 'Числовой ответ'),
        ('formula', 'Формула'),
    ]

    LEVELS = [
        ('school', 'Школьный'),
        ('municipal', 'Муниципальный'),
        ('regional', 'Региональный'),
        ('final', 'Заключительный'),
    ]

    homework = models.ForeignKey(Homework, on_delete=models.CASCADE, related_name='problems',
                                 null=True, blank=True, verbose_name='Домашнее задание')
    order = models.IntegerField(default=0, verbose_name='Порядок')
    title = models.CharField(max_length=255, blank=True, default='', verbose_name='Название')
    statement = models.TextField(help_text='Условие задачи (markdown с LaTeX)', verbose_name='Условие')
    answer_type = models.CharField(max_length=20, choices=ANSWER_TYPES, verbose_name='Тип ответа')
    correct_answer = models.JSONField(null=True, blank=True,
                                       help_text='JSON with correct answer data',
                                       verbose_name='Правильный ответ (JSON)')
    max_score = models.IntegerField(default=1, verbose_name='Макс. балл')
    hint = models.TextField(blank=True, default='', verbose_name='Подсказка')
    solution = models.TextField(blank=True, default='', help_text='Подробный разбор (markdown с LaTeX)',
                                verbose_name='Разбор')
    level = models.CharField(max_length=20, choices=LEVELS, blank=True, default='',
                             verbose_name='Этап олимпиады')
    source = models.CharField(max_length=255, blank=True, default='', help_text='Источник, напр. «ВсОШ 2023»',
                              verbose_name='Источник')
    tags = models.ManyToManyField(Tag, blank=True, related_name='problems', verbose_name='Теги')
    in_bank = models.BooleanField(default=False, help_text='Показывать в банке задач',
                                  verbose_name='В банке задач')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создано')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Обновлено')

    class Meta:
        db_table = 'problems'
        ordering = ['order']
        verbose_name = 'Задача'
        verbose_name_plural = 'Задачи'

    def __str__(self):
        return f'Задача {self.order} ({self.homework})'


class ProblemOption(models.Model):
    problem = models.ForeignKey(Problem, on_delete=models.CASCADE, related_name='options',
                                verbose_name='Задача')
    text = models.CharField(max_length=500, verbose_name='Текст варианта')
    is_correct = models.BooleanField(default=False, verbose_name='Правильный')
    order = models.IntegerField(default=0, verbose_name='Порядок')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создано')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Обновлено')

    class Meta:
        db_table = 'problem_options'
        ordering = ['order']
        verbose_name = 'Вариант ответа'
        verbose_name_plural = 'Варианты ответа'

    def __str__(self):
        return self.text


class ProblemAttachment(models.Model):
    problem = models.ForeignKey(Problem, on_delete=models.CASCADE, related_name='attachments',
                                verbose_name='Задача')
    file = models.FileField(upload_to='problems/attachments/', verbose_name='Файл')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создано')

    class Meta:
        db_table = 'problem_attachments'
        verbose_name = 'Вложение задачи'
        verbose_name_plural = 'Вложения задач'

    def __str__(self):
        return f'Attachment for {self.problem}'


class Submission(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='submissions',
                             verbose_name='Ученик')
    problem = models.ForeignKey(Problem, on_delete=models.CASCADE, related_name='submissions',
                                verbose_name='Задача')
    answer = models.JSONField(help_text='JSON with student answer', verbose_name='Ответ ученика (JSON)')
    is_auto_checked = models.BooleanField(default=False, verbose_name='Автопроверка')
    is_correct = models.BooleanField(null=True, blank=True, default=None, verbose_name='Верно')
    score = models.IntegerField(null=True, blank=True, verbose_name='Балл')
    admin_comment = models.TextField(blank=True, default='', verbose_name='Комментарий проверяющего')
    submitted_at = models.DateTimeField(auto_now_add=True, verbose_name='Отправлено')
    checked_at = models.DateTimeField(null=True, blank=True, verbose_name='Проверено')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создано')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Обновлено')

    class Meta:
        db_table = 'submissions'
        ordering = ['-submitted_at']
        verbose_name = 'Решение ученика'
        verbose_name_plural = 'Решения учеников'

    def __str__(self):
        return f'{self.user} - {self.problem} - {self.submitted_at}'
