from django.contrib import admin
from django.utils import timezone

from .models import Homework, Problem, ProblemOption, ProblemAttachment, Submission, Tag


class ProblemOptionInline(admin.TabularInline):
    model = ProblemOption
    extra = 2
    fields = ['text', 'is_correct', 'order']
    ordering = ['order']


class ProblemAttachmentInline(admin.TabularInline):
    model = ProblemAttachment
    extra = 0
    fields = ['file', 'created_at']
    readonly_fields = ['created_at']


class ProblemInline(admin.TabularInline):
    model = Problem
    extra = 0
    fields = ['order', 'statement', 'answer_type', 'max_score']
    ordering = ['order']
    show_change_link = True


@admin.register(Homework)
class HomeworkAdmin(admin.ModelAdmin):
    list_display = ['__str__', 'lesson', 'due_date', 'problem_count', 'created_at']
    list_filter = ['lesson__topic__block__course', 'due_date']
    search_fields = ['title', 'lesson__title']
    autocomplete_fields = ['lesson']
    list_select_related = ['lesson']
    date_hierarchy = 'due_date'
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [ProblemInline]

    fieldsets = (
        ('Основное', {'fields': ('lesson', 'title', 'due_date')}),
        ('Служебное', {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )

    @admin.display(description='Кол-во задач')
    def problem_count(self, obj):
        return obj.problems.count()


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug']
    search_fields = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}
    ordering = ['name']


@admin.register(Problem)
class ProblemAdmin(admin.ModelAdmin):
    list_display = ['__str__', 'title', 'answer_type', 'max_score', 'level', 'in_bank', 'order', 'homework']
    list_editable = ['in_bank', 'order']
    list_filter = ['answer_type', 'level', 'in_bank', 'tags']
    search_fields = ['statement', 'title', 'source']
    autocomplete_fields = ['homework']
    filter_horizontal = ['tags']
    list_select_related = ['homework']
    ordering = ['homework', 'order']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [ProblemOptionInline, ProblemAttachmentInline]

    fieldsets = (
        ('Условие', {'fields': ('homework', 'order', 'title', 'statement', 'answer_type', 'max_score')}),
        ('Ответ и проверка', {'fields': ('correct_answer', 'hint', 'solution')}),
        ('Классификация', {'fields': ('level', 'source', 'tags', 'in_bank')}),
        ('Служебное', {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )


@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ['user', 'problem', 'is_auto_checked', 'is_correct', 'score', 'submitted_at', 'checked_at']
    list_filter = ['is_auto_checked', 'is_correct', 'submitted_at']
    search_fields = ['user__email', 'user__full_name']
    autocomplete_fields = ['user', 'problem']
    list_select_related = ['user', 'problem']
    date_hierarchy = 'submitted_at'
    ordering = ['-submitted_at']
    readonly_fields = ['user', 'problem', 'answer', 'is_auto_checked', 'submitted_at']
    actions = ['mark_correct', 'mark_incorrect']

    fieldsets = (
        ('Информация', {'fields': ('user', 'problem', 'answer', 'is_auto_checked', 'submitted_at')}),
        ('Проверка', {'fields': ('is_correct', 'score', 'admin_comment', 'checked_at')}),
    )

    @admin.action(description='Пометить проверенным/верным')
    def mark_correct(self, request, queryset):
        updated = queryset.update(is_correct=True, checked_at=timezone.now())
        self.message_user(request, f'Помечено верными: {updated}.')

    @admin.action(description='Пометить неверным')
    def mark_incorrect(self, request, queryset):
        updated = queryset.update(is_correct=False, checked_at=timezone.now())
        self.message_user(request, f'Помечено неверными: {updated}.')
