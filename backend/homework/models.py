from django.conf import settings
from django.db import models


class Homework(models.Model):
    lesson = models.OneToOneField('courses.Lesson', on_delete=models.CASCADE, related_name='homework')
    title = models.CharField(max_length=255, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'homeworks'

    def __str__(self):
        return self.title or f'ДЗ к {self.lesson.title}'


class Problem(models.Model):
    ANSWER_TYPES = [
        ('text', 'Текстовый ответ'),
        ('choice_single', 'Один вариант'),
        ('choice_multiple', 'Несколько вариантов'),
        ('number', 'Числовой ответ'),
        ('formula', 'Формула'),
    ]

    homework = models.ForeignKey(Homework, on_delete=models.CASCADE, related_name='problems')
    order = models.IntegerField(default=0)
    statement = models.TextField(help_text='Условие задачи (markdown с LaTeX)')
    answer_type = models.CharField(max_length=20, choices=ANSWER_TYPES)
    correct_answer = models.JSONField(null=True, blank=True,
                                       help_text='JSON with correct answer data')
    max_score = models.IntegerField(default=1)
    hint = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'problems'
        ordering = ['order']

    def __str__(self):
        return f'Задача {self.order} ({self.homework})'


class ProblemOption(models.Model):
    problem = models.ForeignKey(Problem, on_delete=models.CASCADE, related_name='options')
    text = models.CharField(max_length=500)
    is_correct = models.BooleanField(default=False)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'problem_options'
        ordering = ['order']

    def __str__(self):
        return self.text


class ProblemAttachment(models.Model):
    problem = models.ForeignKey(Problem, on_delete=models.CASCADE, related_name='attachments')
    file = models.FileField(upload_to='problems/attachments/')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'problem_attachments'

    def __str__(self):
        return f'Attachment for {self.problem}'


class Submission(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='submissions')
    problem = models.ForeignKey(Problem, on_delete=models.CASCADE, related_name='submissions')
    answer = models.JSONField(help_text='JSON with student answer')
    is_auto_checked = models.BooleanField(default=False)
    is_correct = models.BooleanField(null=True, blank=True, default=None)
    score = models.IntegerField(null=True, blank=True)
    admin_comment = models.TextField(blank=True, default='')
    submitted_at = models.DateTimeField(auto_now_add=True)
    checked_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'submissions'
        ordering = ['-submitted_at']

    def __str__(self):
        return f'{self.user} - {self.problem} - {self.submitted_at}'
