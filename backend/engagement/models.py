from django.conf import settings
from django.db import models


class Favorite(models.Model):
    """A bookmarked lesson or problem (избранное)."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='favorites')
    lesson = models.ForeignKey('courses.Lesson', on_delete=models.CASCADE, null=True, blank=True, related_name='favorited_by')
    problem = models.ForeignKey('homework.Problem', on_delete=models.CASCADE, null=True, blank=True, related_name='favorited_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'favorites'
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'lesson'], name='uniq_fav_lesson',
                condition=models.Q(lesson__isnull=False),
            ),
            models.UniqueConstraint(
                fields=['user', 'problem'], name='uniq_fav_problem',
                condition=models.Q(problem__isnull=False),
            ),
        ]

    def __str__(self):
        target = self.lesson or self.problem
        return f'{self.user} ★ {target}'


class LessonRating(models.Model):
    """A student's rating of a lesson (оценка урока)."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='lesson_ratings')
    lesson = models.ForeignKey('courses.Lesson', on_delete=models.CASCADE, related_name='ratings')
    rating = models.PositiveSmallIntegerField(help_text='Оценка от 1 до 5')
    comment = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'lesson_ratings'
        unique_together = ['user', 'lesson']
        ordering = ['-updated_at']

    def __str__(self):
        return f'{self.user} → {self.lesson}: {self.rating}'


class Question(models.Model):
    """A question to the teacher/curator under a lesson or a problem."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='questions')
    lesson = models.ForeignKey('courses.Lesson', on_delete=models.CASCADE, null=True, blank=True, related_name='questions')
    problem = models.ForeignKey('homework.Problem', on_delete=models.CASCADE, null=True, blank=True, related_name='questions')
    text = models.TextField()
    answer = models.TextField(blank=True, default='')
    answered_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='answered_questions')
    answered_at = models.DateTimeField(null=True, blank=True)
    is_answered = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'questions'
        ordering = ['-created_at']

    def __str__(self):
        return f'Вопрос от {self.user}'
