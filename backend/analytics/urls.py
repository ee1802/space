from django.urls import path
from . import views

urlpatterns = [
    path('me/stats', views.me_stats, name='me-stats'),
    path('me/recommendations', views.me_recommendations, name='me-recommendations'),
    path('search', views.search, name='search'),
]
