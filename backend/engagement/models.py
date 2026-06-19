from django.conf import settings
from django.db import models


class Favorite(models.Model):
    """A bookmarked lesson or problem (избранное)."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='favorites', verbose_name='Ученик')
    lesson = models.ForeignKey('courses.Lesson', on_delete=models.CASCADE, null=True, blank=True, related_name='favorited_by', verbose_name='Урок')
    problem = models.ForeignKey('homework.Problem', on_delete=models.CASCADE, null=True, blank=True, related_name='favorited_by', verbose_name='Задача')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создан')

    class Meta:
        db_table = 'favorites'
        ordering = ['-created_at']
        verbose_name = 'Избранное'
        verbose_name_plural = 'Избранное'
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
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='lesson_ratings', verbose_name='Ученик')
    lesson = models.ForeignKey('courses.Lesson', on_delete=models.CASCADE, related_name='ratings', verbose_name='Урок')
    rating = models.PositiveSmallIntegerField(help_text='Оценка от 1 до 5', verbose_name='Оценка (1-5)')
    comment = models.TextField(blank=True, default='', verbose_name='Комментарий')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создан')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Обновлён')

    class Meta:
        db_table = 'lesson_ratings'
        unique_together = ['user', 'lesson']
        ordering = ['-updated_at']
        verbose_name = 'Оценка урока'
        verbose_name_plural = 'Оценки уроков'

    def __str__(self):
        return f'{self.user} → {self.lesson}: {self.rating}'


class Question(models.Model):
    """A question to the teacher/curator under a lesson or a problem."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='questions', verbose_name='Ученик')
    lesson = models.ForeignKey('courses.Lesson', on_delete=models.CASCADE, null=True, blank=True, related_name='questions', verbose_name='Урок')
    problem = models.ForeignKey('homework.Problem', on_delete=models.CASCADE, null=True, blank=True, related_name='questions', verbose_name='Задача')
    text = models.TextField(verbose_name='Текст вопроса')
    answer = models.TextField(blank=True, default='', verbose_name='Ответ')
    answered_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='answered_questions', verbose_name='Ответил')
    answered_at = models.DateTimeField(null=True, blank=True, verbose_name='Дата ответа')
    is_answered = models.BooleanField(default=False, verbose_name='Отвечен')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создан')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Обновлён')

    class Meta:
        db_table = 'questions'
        ordering = ['-created_at']
        verbose_name = 'Вопрос'
        verbose_name_plural = 'Вопросы'

    def __str__(self):
        return f'Вопрос от {self.user}'
