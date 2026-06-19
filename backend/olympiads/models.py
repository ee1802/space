from django.conf import settings
from django.db import models


class MockOlympiad(models.Model):
    """Timed mock olympiad (пробная олимпиада на время)."""
    LEVELS = [
        ('school', 'Школьный'),
        ('municipal', 'Муниципальный'),
        ('regional', 'Региональный'),
        ('final', 'Заключительный'),
    ]
    title = models.CharField(max_length=255, verbose_name='Название')
    description = models.TextField(blank=True, default='', verbose_name='Описание')
    level = models.CharField(max_length=20, choices=LEVELS, blank=True, default='', verbose_name='Этап')
    duration_minutes = models.IntegerField(default=60, help_text='Длительность тура в минутах', verbose_name='Длительность (мин)')
    is_published = models.BooleanField(default=False, verbose_name='Опубликована')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создана')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Обновлена')

    class Meta:
        db_table = 'mock_olympiads'
        ordering = ['-created_at']
        verbose_name = 'Пробная олимпиада'
        verbose_name_plural = 'Пробные олимпиады'

    def __str__(self):
        return self.title


class MockProblem(models.Model):
    """Link between a mock olympiad and a reused homework.Problem."""
    mock = models.ForeignKey(MockOlympiad, on_delete=models.CASCADE, related_name='mock_problems', verbose_name='Пробная олимпиада')
    problem = models.ForeignKey('homework.Problem', on_delete=models.CASCADE, related_name='mock_links', verbose_name='Задача')
    order = models.IntegerField(default=0, verbose_name='Порядок')

    class Meta:
        db_table = 'mock_problems'
        ordering = ['order']
        unique_together = ['mock', 'problem']
        verbose_name = 'Задача пробника'
        verbose_name_plural = 'Задачи пробника'

    def __str__(self):
        return f'{self.mock} #{self.order}'


class MockAttempt(models.Model):
    """A student's timed attempt at a mock olympiad."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='mock_attempts', verbose_name='Пользователь')
    mock = models.ForeignKey(MockOlympiad, on_delete=models.CASCADE, related_name='attempts', verbose_name='Пробная олимпиада')
    started_at = models.DateTimeField(auto_now_add=True, verbose_name='Начато')
    deadline = models.DateTimeField(help_text='started_at + duration_minutes', verbose_name='Дедлайн')
    finished_at = models.DateTimeField(null=True, blank=True, verbose_name='Завершено')
    is_completed = models.BooleanField(default=False, verbose_name='Завершена')
    score = models.IntegerField(null=True, blank=True, verbose_name='Балл')
    max_score = models.IntegerField(null=True, blank=True, verbose_name='Макс. балл')

    class Meta:
        db_table = 'mock_attempts'
        ordering = ['-started_at']
        verbose_name = 'Попытка'
        verbose_name_plural = 'Попытки'

    def __str__(self):
        return f'{self.user} - {self.mock}'


class MockAnswer(models.Model):
    """A single answer inside a mock attempt (graded on finish)."""
    attempt = models.ForeignKey(MockAttempt, on_delete=models.CASCADE, related_name='answers', verbose_name='Попытка')
    problem = models.ForeignKey('homework.Problem', on_delete=models.CASCADE, verbose_name='Задача')
    answer = models.JSONField(null=True, blank=True, verbose_name='Ответ')
    is_correct = models.BooleanField(null=True, blank=True, default=None, verbose_name='Верно')
    score = models.IntegerField(null=True, blank=True, verbose_name='Балл')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Обновлено')

    class Meta:
        db_table = 'mock_answers'
        unique_together = ['attempt', 'problem']
        verbose_name = 'Ответ в попытке'
        verbose_name_plural = 'Ответы в попытках'

    def __str__(self):
        return f'{self.attempt} - {self.problem}'
