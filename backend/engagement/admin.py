from django.contrib import admin
from django.utils import timezone

from .models import Favorite, LessonRating, Question


@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ['user', 'lesson', 'problem', 'target_display', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__email', 'lesson__title', 'problem__title']
    autocomplete_fields = ['user', 'lesson', 'problem']
    list_select_related = ['user', 'lesson', 'problem']
    date_hierarchy = 'created_at'
    readonly_fields = ['created_at']
    ordering = ['-created_at']

    @admin.display(description='Объект')
    def target_display(self, obj):
        return obj.lesson or obj.problem


@admin.register(LessonRating)
class LessonRatingAdmin(admin.ModelAdmin):
    list_display = ['user', 'lesson', 'rating', 'short_comment', 'updated_at']
    list_filter = ['rating', 'updated_at']
    search_fields = ['user__email', 'lesson__title', 'comment']
    autocomplete_fields = ['user', 'lesson']
    list_select_related = ['user', 'lesson']
    date_hierarchy = 'updated_at'
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['-updated_at']
    fieldsets = (
        ('Оценка', {
            'fields': ('user', 'lesson', 'rating', 'comment'),
        }),
        ('Служебное', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    @admin.display(description='Комментарий')
    def short_comment(self, obj):
        if not obj.comment:
            return '—'
        return obj.comment[:60] + ('…' if len(obj.comment) > 60 else '')


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ['user', 'target_display', 'is_answered', 'answered_by', 'created_at']
    list_filter = ['is_answered', 'lesson', 'created_at']
    search_fields = ['user__email', 'text', 'answer']
    autocomplete_fields = ['user', 'lesson', 'problem', 'answered_by']
    list_select_related = ['user', 'lesson', 'problem', 'answered_by']
    date_hierarchy = 'created_at'
    readonly_fields = ['user', 'text', 'lesson', 'problem', 'created_at', 'updated_at', 'answered_at', 'answered_by']
    ordering = ['-created_at']
    actions = ['mark_answered']
    fieldsets = (
        ('Вопрос', {
            'fields': ('user', 'text', 'lesson', 'problem', 'created_at'),
        }),
        ('Ответ', {
            'fields': ('answer', 'is_answered', 'answered_by', 'answered_at'),
        }),
    )

    @admin.display(description='Объект')
    def target_display(self, obj):
        return obj.lesson or obj.problem or '—'

    @admin.action(description='Пометить отвеченным')
    def mark_answered(self, request, queryset):
        updated = queryset.update(
            is_answered=True,
            answered_at=timezone.now(),
            answered_by=request.user,
        )
        self.message_user(request, f'Помечено как отвеченные: {updated}.')

    def save_model(self, request, obj, form, change):
        # Auto-fill the answer metadata when a curator provides an answer.
        if obj.answer and obj.answer.strip():
            if not obj.is_answered:
                obj.is_answered = True
            if obj.answered_by is None:
                obj.answered_by = request.user
            if obj.answered_at is None:
                obj.answered_at = timezone.now()
        super().save_model(request, obj, form, change)
