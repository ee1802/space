from django.contrib import admin
from django.utils.html import format_html
from .models import (
    Course, Enrollment, Block, Topic, Lesson, LessonMaterial, LessonProgress,
)


class BlockInline(admin.TabularInline):
    model = Block
    extra = 0
    fields = ['title', 'order']
    ordering = ['order']
    show_change_link = True


class TopicInline(admin.TabularInline):
    model = Topic
    extra = 0
    fields = ['title', 'order']
    ordering = ['order']
    show_change_link = True


class LessonInline(admin.TabularInline):
    model = Lesson
    extra = 0
    fields = ['title', 'lesson_type', 'lesson_date', 'video_url', 'is_published', 'order']
    ordering = ['order']
    show_change_link = True


class LessonMaterialInline(admin.TabularInline):
    model = LessonMaterial
    extra = 0
    fields = ['title', 'kind', 'file', 'order']
    ordering = ['order']


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ['title', 'slug', 'is_published', 'cover_preview', 'created_at', 'updated_at']
    list_editable = ['is_published']
    list_filter = ['is_published']
    search_fields = ['title', 'slug']
    prepopulated_fields = {'slug': ('title',)}
    date_hierarchy = 'created_at'
    ordering = ['-updated_at']
    readonly_fields = ['cover_preview', 'created_at', 'updated_at']
    inlines = [BlockInline]
    actions = ['publish_courses', 'unpublish_courses']
    fieldsets = (
        ('Основное', {
            'fields': ('title', 'slug', 'description', 'is_published'),
        }),
        ('Обложка', {
            'fields': ('cover_image', 'cover_preview'),
        }),
        ('Служебное', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    @admin.display(description='Превью обложки')
    def cover_preview(self, obj):
        if obj.cover_image:
            return format_html(
                '<img src="{}" style="max-height:80px;border-radius:6px;" />',
                obj.cover_image.url,
            )
        return '—'

    @admin.action(description='Опубликовать выбранные курсы')
    def publish_courses(self, request, queryset):
        updated = queryset.update(is_published=True)
        self.message_user(request, f'Опубликовано курсов: {updated}.')

    @admin.action(description='Снять с публикации выбранные курсы')
    def unpublish_courses(self, request, queryset):
        updated = queryset.update(is_published=False)
        self.message_user(request, f'Снято с публикации курсов: {updated}.')


@admin.register(Block)
class BlockAdmin(admin.ModelAdmin):
    list_display = ['title', 'course', 'order']
    list_editable = ['order']
    list_filter = ['course']
    search_fields = ['title', 'course__title']
    autocomplete_fields = ['course']
    list_select_related = ['course']
    ordering = ['course', 'order']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [TopicInline]


@admin.register(Topic)
class TopicAdmin(admin.ModelAdmin):
    list_display = ['title', 'block', 'order']
    list_editable = ['order']
    list_filter = ['block__course']
    search_fields = ['title', 'block__title', 'block__course__title']
    autocomplete_fields = ['block']
    list_select_related = ['block', 'block__course']
    ordering = ['block', 'order']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [LessonInline]


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ['title', 'topic', 'lesson_type', 'lesson_date', 'has_files', 'is_published', 'order']
    list_editable = ['is_published', 'order']
    list_filter = ['lesson_type', 'is_published', 'topic__block__course']
    search_fields = ['title', 'topic__title', 'topic__block__course__title']
    autocomplete_fields = ['topic']
    list_select_related = ['topic', 'topic__block', 'topic__block__course']
    date_hierarchy = 'lesson_date'
    ordering = ['topic', 'order']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [LessonMaterialInline]
    actions = ['publish_lessons', 'unpublish_lessons']
    fieldsets = (
        ('Основное', {
            'fields': ('topic', 'title', 'lesson_type', 'lesson_date', 'is_published', 'order'),
        }),
        ('Видео', {
            'fields': ('video_provider', 'video_url'),
        }),
        ('Материалы и описание', {
            'fields': ('description', 'notes_file', 'workbook_file'),
        }),
        ('Служебное', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    @admin.display(description='Файлы', boolean=True)
    def has_files(self, obj):
        return bool(obj.notes_file or obj.workbook_file)

    @admin.action(description='Опубликовать выбранные уроки')
    def publish_lessons(self, request, queryset):
        updated = queryset.update(is_published=True)
        self.message_user(request, f'Опубликовано уроков: {updated}.')

    @admin.action(description='Снять с публикации выбранные уроки')
    def unpublish_lessons(self, request, queryset):
        updated = queryset.update(is_published=False)
        self.message_user(request, f'Снято с публикации уроков: {updated}.')


@admin.register(LessonMaterial)
class LessonMaterialAdmin(admin.ModelAdmin):
    list_display = ['title', 'lesson', 'kind', 'order']
    list_editable = ['order']
    list_filter = ['kind']
    search_fields = ['title', 'lesson__title']
    autocomplete_fields = ['lesson']
    list_select_related = ['lesson']
    ordering = ['lesson', 'order']
    readonly_fields = ['created_at']


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ['user', 'course', 'granted_at', 'manual_progress_override']
    list_editable = ['manual_progress_override']
    list_filter = ['course', 'granted_at']
    search_fields = ['user__email', 'user__full_name', 'course__title']
    autocomplete_fields = ['user', 'course']
    list_select_related = ['user', 'course']
    date_hierarchy = 'granted_at'
    ordering = ['-granted_at']
    readonly_fields = ['granted_at', 'created_at', 'updated_at']


@admin.register(LessonProgress)
class LessonProgressAdmin(admin.ModelAdmin):
    list_display = ['user', 'lesson', 'is_watched', 'watched_at']
    list_filter = ['is_watched', 'watched_at']
    search_fields = ['user__email', 'lesson__title']
    autocomplete_fields = ['user', 'lesson']
    list_select_related = ['user', 'lesson']
    date_hierarchy = 'watched_at'
    ordering = ['-watched_at']
    readonly_fields = ['created_at', 'updated_at']
