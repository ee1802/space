from django.urls import path
from . import views

urlpatterns = [
    # Mock olympiads
    path('olympiads', views.MockOlympiadListView.as_view(), name='olympiad-list'),

    # Attempt actions (declared before the <int:pk> detail to avoid any shadowing)
    path('olympiads/attempts/<int:pk>', views.attempt_detail, name='olympiad-attempt-detail'),
    path('olympiads/attempts/<int:pk>/answer', views.submit_attempt_answer, name='olympiad-attempt-answer'),
    path('olympiads/attempts/<int:pk>/finish', views.finish_attempt, name='olympiad-attempt-finish'),

    path('olympiads/<int:pk>', views.MockOlympiadDetailView.as_view(), name='olympiad-detail'),
    path('olympiads/<int:pk>/start', views.start_attempt, name='olympiad-start'),

    # My attempts history
    path('me/olympiad-attempts', views.MyOlympiadAttemptsView.as_view(), name='my-olympiad-attempts'),
]
