from django.contrib import admin
from .models import Favorite, LessonRating, Question


@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ['user', 'lesson', 'problem', 'created_at']
    search_fields = ['user__email']


@admin.register(LessonRating)
class LessonRatingAdmin(admin.ModelAdmin):
    list_display = ['user', 'lesson', 'rating', 'updated_at']
    list_filter = ['rating']
    search_fields = ['user__email', 'lesson__title']


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ['user', 'lesson', 'problem', 'is_answered', 'created_at']
    list_filter = ['is_answered']
    search_fields = ['user__email', 'text']
