from django.contrib import admin
from .models import Course, Enrollment, Block, Topic, Lesson, LessonProgress


class BlockInline(admin.TabularInline):
    model = Block
    extra = 0
    fields = ['title', 'order']
    ordering = ['order']


class TopicInline(admin.TabularInline):
    model = Topic
    extra = 0
    fields = ['title', 'order']
    ordering = ['order']


class LessonInline(admin.TabularInline):
    model = Lesson
    extra = 0
    fields = ['title', 'lesson_date', 'video_url', 'is_published', 'order']
    ordering = ['order']


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ['title', 'slug', 'is_published', 'created_at', 'updated_at']
    list_filter = ['is_published']
    search_fields = ['title', 'slug']
    prepopulated_fields = {'slug': ('title',)}
    inlines = [BlockInline]


@admin.register(Block)
class BlockAdmin(admin.ModelAdmin):
    list_display = ['title', 'course', 'order']
    list_filter = ['course']
    search_fields = ['title']
    inlines = [TopicInline]


@admin.register(Topic)
class TopicAdmin(admin.ModelAdmin):
    list_display = ['title', 'block', 'order']
    list_filter = ['block__course']
    search_fields = ['title']
    inlines = [LessonInline]


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ['title', 'topic', 'lesson_date', 'is_published', 'order']
    list_filter = ['is_published', 'topic__block__course']
    search_fields = ['title']


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ['user', 'course', 'granted_at', 'manual_progress_override']
    list_filter = ['course']
    search_fields = ['user__email', 'user__full_name']


@admin.register(LessonProgress)
class LessonProgressAdmin(admin.ModelAdmin):
    list_display = ['user', 'lesson', 'is_watched', 'watched_at']
    list_filter = ['is_watched']
