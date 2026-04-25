from django.db import models


class OlympiadEventType(models.Model):
    name = models.CharField(max_length=255, unique=True)
    color = models.CharField(max_length=7, default='#3B82F6', help_text='Hex color for calendar display')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'olympiad_event_types'
        ordering = ['name']

    def __str__(self):
        return self.name


class OlympiadEvent(models.Model):
    title = models.CharField(max_length=255)
    event_type = models.ForeignKey(OlympiadEventType, on_delete=models.SET_NULL, null=True, related_name='events')
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    time = models.TimeField(null=True, blank=True)
    description = models.TextField(blank=True, default='')
    external_url = models.URLField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'olympiad_events'
        ordering = ['start_date']

    def __str__(self):
        return self.title
