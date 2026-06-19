from django.contrib import admin
from django.utils.html import format_html

from .models import OlympiadEventType, OlympiadEvent


@admin.register(OlympiadEventType)
class OlympiadEventTypeAdmin(admin.ModelAdmin):
    list_display = ['name', 'color_swatch', 'created_at']
    search_fields = ['name']
    ordering = ['name']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        ('Основное', {
            'fields': ('name', 'color'),
        }),
        ('Служебные поля', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    @admin.display(description='Цвет')
    def color_swatch(self, obj):
        return format_html(
            '<span style="display:inline-block;width:14px;height:14px;'
            'border:1px solid #999;border-radius:3px;vertical-align:middle;'
            'background:{};margin-right:6px;"></span>{}',
            obj.color,
            obj.color,
        )


@admin.register(OlympiadEvent)
class OlympiadEventAdmin(admin.ModelAdmin):
    list_display = [
        'title',
        'event_type',
        'start_date',
        'end_date',
        'time',
        'external_link',
    ]
    list_filter = ['event_type', 'start_date']
    search_fields = ['title', 'description']
    date_hierarchy = 'start_date'
    ordering = ['start_date']
    autocomplete_fields = ['event_type']
    list_select_related = ['event_type']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        ('Событие', {
            'fields': ('title', 'event_type', 'description'),
        }),
        ('Даты и время', {
            'fields': ('start_date', 'end_date', 'time'),
        }),
        ('Ссылка', {
            'fields': ('external_url',),
        }),
        ('Служебные поля', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    @admin.display(description='Внешняя ссылка')
    def external_link(self, obj):
        if not obj.external_url:
            return '—'
        return format_html(
            '<a href="{}" target="_blank" rel="noopener">Открыть</a>',
            obj.external_url,
        )
