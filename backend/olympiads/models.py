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
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    level = models.CharField(max_length=20, choices=LEVELS, blank=True, default='')
    duration_minutes = models.IntegerField(default=60, help_text='Длительность тура в минутах')
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'mock_olympiads'
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class MockProblem(models.Model):
    """Link between a mock olympiad and a reused homework.Problem."""
    mock = models.ForeignKey(MockOlympiad, on_delete=models.CASCADE, related_name='mock_problems')
    problem = models.ForeignKey('homework.Problem', on_delete=models.CASCADE, related_name='mock_links')
    order = models.IntegerField(default=0)

    class Meta:
        db_table = 'mock_problems'
        ordering = ['order']
        unique_together = ['mock', 'problem']

    def __str__(self):
        return f'{self.mock} #{self.order}'


class MockAttempt(models.Model):
    """A student's timed attempt at a mock olympiad."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='mock_attempts')
    mock = models.ForeignKey(MockOlympiad, on_delete=models.CASCADE, related_name='attempts')
    started_at = models.DateTimeField(auto_now_add=True)
    deadline = models.DateTimeField(help_text='started_at + duration_minutes')
    finished_at = models.DateTimeField(null=True, blank=True)
    is_completed = models.BooleanField(default=False)
    score = models.IntegerField(null=True, blank=True)
    max_score = models.IntegerField(null=True, blank=True)

    class Meta:
        db_table = 'mock_attempts'
        ordering = ['-started_at']

    def __str__(self):
        return f'{self.user} - {self.mock}'


class MockAnswer(models.Model):
    """A single answer inside a mock attempt (graded on finish)."""
    attempt = models.ForeignKey(MockAttempt, on_delete=models.CASCADE, related_name='answers')
    problem = models.ForeignKey('homework.Problem', on_delete=models.CASCADE)
    answer = models.JSONField(null=True, blank=True)
    is_correct = models.BooleanField(null=True, blank=True, default=None)
    score = models.IntegerField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'mock_answers'
        unique_together = ['attempt', 'problem']

    def __str__(self):
        return f'{self.attempt} - {self.problem}'
