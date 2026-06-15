from django.contrib import admin
from .models import MockOlympiad, MockProblem, MockAttempt, MockAnswer


class MockProblemInline(admin.TabularInline):
    model = MockProblem
    extra = 1


@admin.register(MockOlympiad)
class MockOlympiadAdmin(admin.ModelAdmin):
    list_display = ['title', 'level', 'duration_minutes', 'is_published', 'created_at']
    list_filter = ['level', 'is_published']
    search_fields = ['title']
    inlines = [MockProblemInline]


@admin.register(MockAttempt)
class MockAttemptAdmin(admin.ModelAdmin):
    list_display = ['user', 'mock', 'started_at', 'finished_at', 'is_completed', 'score', 'max_score']
    list_filter = ['is_completed', 'mock']
    search_fields = ['user__email']


@admin.register(MockAnswer)
class MockAnswerAdmin(admin.ModelAdmin):
    list_display = ['attempt', 'problem', 'is_correct', 'score']
