from django.contrib import admin
from .models import Homework, Problem, ProblemOption, ProblemAttachment, Submission, Tag


class ProblemOptionInline(admin.TabularInline):
    model = ProblemOption
    extra = 2
    fields = ['text', 'is_correct', 'order']


class ProblemAttachmentInline(admin.TabularInline):
    model = ProblemAttachment
    extra = 0


class ProblemInline(admin.TabularInline):
    model = Problem
    extra = 0
    fields = ['order', 'statement', 'answer_type', 'max_score']
    ordering = ['order']
    show_change_link = True


@admin.register(Homework)
class HomeworkAdmin(admin.ModelAdmin):
    list_display = ['__str__', 'lesson', 'due_date', 'created_at']
    search_fields = ['title', 'lesson__title']
    inlines = [ProblemInline]


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug']
    search_fields = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Problem)
class ProblemAdmin(admin.ModelAdmin):
    list_display = ['__str__', 'title', 'answer_type', 'max_score', 'level', 'in_bank', 'homework']
    list_filter = ['answer_type', 'level', 'in_bank']
    search_fields = ['statement', 'title', 'source']
    filter_horizontal = ['tags']
    inlines = [ProblemOptionInline, ProblemAttachmentInline]


@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ['user', 'problem', 'is_auto_checked', 'is_correct', 'score', 'submitted_at', 'checked_at']
    list_filter = ['is_auto_checked', 'is_correct']
    search_fields = ['user__email', 'user__full_name']
    readonly_fields = ['user', 'problem', 'answer', 'is_auto_checked', 'submitted_at']

    fieldsets = (
        ('Информация', {'fields': ('user', 'problem', 'answer', 'is_auto_checked', 'submitted_at')}),
        ('Проверка', {'fields': ('is_correct', 'score', 'admin_comment', 'checked_at')}),
    )
