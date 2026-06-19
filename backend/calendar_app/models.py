from django.db import models


class OlympiadEventType(models.Model):
    name = models.CharField(max_length=255, unique=True, verbose_name='Название')
    color = models.CharField(
        max_length=7,
        default='#3B82F6',
        help_text='Hex color for calendar display',
        verbose_name='Цвет',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'olympiad_event_types'
        ordering = ['name']
        verbose_name = 'Тип события'
        verbose_name_plural = 'Типы событий'

    def __str__(self):
        return self.name


class OlympiadEvent(models.Model):
    title = models.CharField(max_length=255, verbose_name='Название')
    event_type = models.ForeignKey(
        OlympiadEventType,
        on_delete=models.SET_NULL,
        null=True,
        related_name='events',
        verbose_name='Тип события',
    )
    start_date = models.DateField(verbose_name='Дата начала')
    end_date = models.DateField(null=True, blank=True, verbose_name='Дата окончания')
    time = models.TimeField(null=True, blank=True, verbose_name='Время')
    description = models.TextField(blank=True, default='', verbose_name='Описание')
    external_url = models.URLField(blank=True, default='', verbose_name='Внешняя ссылка')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'olympiad_events'
        ordering = ['start_date']
        verbose_name = 'Событие календаря'
        verbose_name_plural = 'События календаря'

    def __str__(self):
        return self.title
