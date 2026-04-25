from django.conf import settings
from django.db import models


class Course(models.Model):
    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True, max_length=255)
    description = models.TextField(blank=True, default='')
    cover_image = models.ImageField(upload_to='courses/covers/', blank=True, null=True)
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'courses'
        ordering = ['-updated_at']

    def __str__(self):
        return self.title


class Enrollment(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='enrollments')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments')
    granted_at = models.DateTimeField(auto_now_add=True)
    manual_progress_override = models.IntegerField(null=True, blank=True,
                                                    help_text='Manual progress override 0-100')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'enrollments'
        unique_together = ['user', 'course']

    def __str__(self):
        return f'{self.user} -> {self.course}'


class Block(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='blocks')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'blocks'
        ordering = ['order']

    def __str__(self):
        return self.title


class Topic(models.Model):
    block = models.ForeignKey(Block, on_delete=models.CASCADE, related_name='topics')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'topics'
        ordering = ['order']

    def __str__(self):
        return self.title


class Lesson(models.Model):
    VIDEO_PROVIDERS = [
        ('youtube', 'YouTube'),
        ('vk', 'VK Video'),
        ('yandex', 'Yandex Disk'),
    ]

    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, related_name='lessons')
    title = models.CharField(max_length=255)
    lesson_date = models.DateField(null=True, blank=True)
    video_provider = models.CharField(max_length=20, choices=VIDEO_PROVIDERS, default='youtube')
    video_url = models.URLField(blank=True, default='')
    description = models.TextField(blank=True, default='')
    notes_file = models.FileField(upload_to='lessons/notes/', blank=True, null=True)
    workbook_file = models.FileField(upload_to='lessons/workbooks/', blank=True, null=True)
    is_published = models.BooleanField(default=False)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'lessons'
        ordering = ['order']

    def __str__(self):
        return self.title


class LessonProgress(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='lesson_progress')
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='progress')
    is_watched = models.BooleanField(default=False)
    watched_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'lesson_progress'
        unique_together = ['user', 'lesson']

    def __str__(self):
        return f'{self.user} - {self.lesson} - {"watched" if self.is_watched else "not watched"}'
