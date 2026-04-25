from django.contrib import admin
from .models import OlympiadEventType, OlympiadEvent


@admin.register(OlympiadEventType)
class OlympiadEventTypeAdmin(admin.ModelAdmin):
    list_display = ['name', 'color']
    search_fields = ['name']


@admin.register(OlympiadEvent)
class OlympiadEventAdmin(admin.ModelAdmin):
    list_display = ['title', 'event_type', 'start_date', 'end_date', 'time']
    list_filter = ['event_type', 'start_date']
    search_fields = ['title']
    date_hierarchy = 'start_date'
