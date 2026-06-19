from django.contrib import admin

from .models import MockOlympiad, MockProblem, MockAttempt, MockAnswer


class MockProblemInline(admin.TabularInline):
    model = MockProblem
    extra = 1
    fields = ['order', 'problem']
    autocomplete_fields = ['problem']
    ordering = ['order']
    verbose_name = 'Задача пробника'
    verbose_name_plural = 'Задачи пробника'


@admin.register(MockOlympiad)
class MockOlympiadAdmin(admin.ModelAdmin):
    list_display = ['title', 'level', 'duration_minutes', 'problems_count', 'is_published', 'created_at']
    list_display_links = ['title']
    list_editable = ['is_published']
    list_filter = ['level', 'is_published', 'created_at']
    search_fields = ['title', 'description']
    date_hierarchy = 'created_at'
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [MockProblemInline]
    actions = ['publish', 'unpublish']
    fieldsets = (
        ('Основное', {
            'fields': ('title', 'description', 'level'),
        }),
        ('Параметры тура', {
            'fields': ('duration_minutes', 'is_published'),
        }),
        ('Служебное', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.prefetch_related('mock_problems')

    @admin.display(description='Задач', ordering='id')
    def problems_count(self, obj):
        return obj.mock_problems.count()

    @admin.action(description='Опубликовать выбранные олимпиады')
    def publish(self, request, queryset):
        updated = queryset.update(is_published=True)
        self.message_user(request, f'Опубликовано олимпиад: {updated}.')

    @admin.action(description='Снять с публикации выбранные олимпиады')
    def unpublish(self, request, queryset):
        updated = queryset.update(is_published=False)
        self.message_user(request, f'Снято с публикации: {updated}.')


@admin.register(MockAttempt)
class MockAttemptAdmin(admin.ModelAdmin):
    list_display = ['user', 'mock', 'started_at', 'deadline', 'finished_at', 'is_completed', 'score', 'max_score']
    list_filter = ['is_completed', 'mock', 'started_at']
    search_fields = ['user__email', 'mock__title']
    date_hierarchy = 'started_at'
    ordering = ['-started_at']
    list_select_related = ['user', 'mock']
    autocomplete_fields = ['user', 'mock']
    readonly_fields = ['started_at', 'deadline', 'finished_at']
    fieldsets = (
        ('Попытка', {
            'fields': ('user', 'mock'),
        }),
        ('Тайминг', {
            'fields': ('started_at', 'deadline', 'finished_at', 'is_completed'),
        }),
        ('Результат', {
            'fields': ('score', 'max_score'),
        }),
    )


@admin.register(MockAnswer)
class MockAnswerAdmin(admin.ModelAdmin):
    list_display = ['attempt', 'problem', 'is_correct', 'score', 'updated_at']
    list_filter = ['is_correct']
    search_fields = ['attempt__user__email']
    date_hierarchy = 'updated_at'
    ordering = ['-updated_at']
    list_select_related = ['attempt', 'problem']
    autocomplete_fields = ['attempt', 'problem']
    readonly_fields = ['answer', 'updated_at']
    fieldsets = (
        ('Ответ', {
            'fields': ('attempt', 'problem', 'answer'),
        }),
        ('Оценка', {
            'fields': ('is_correct', 'score', 'updated_at'),
        }),
    )
