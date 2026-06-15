from django.urls import path
from . import views

urlpatterns = [
    # Favorites (избранное)
    path('me/favorites', views.my_favorites, name='my-favorites'),
    path('me/favorites/toggle', views.toggle_favorite, name='toggle-favorite'),

    # Ratings (оценка урока)
    path('lessons/<int:lesson_id>/rate', views.rate_lesson, name='rate-lesson'),
    path('lessons/<int:lesson_id>/rating', views.lesson_rating, name='lesson-rating'),

    # Questions (вопросы преподавателю/куратору)
    path('questions', views.questions, name='questions'),
    path('me/questions', views.MyQuestionsView.as_view(), name='my-questions'),

    # Admin
    path('admin/questions', views.AdminQuestionListView.as_view(), name='admin-questions'),
    path('admin/questions/<int:pk>/answer', views.admin_answer_question, name='admin-answer-question'),
]
