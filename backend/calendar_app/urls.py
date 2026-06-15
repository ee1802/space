from django.urls import path
from . import views

urlpatterns = [
    # Student
    path('calendar/events', views.EventListView.as_view(), name='events'),
    path('calendar/event-types', views.EventTypeListView.as_view(), name='event-types'),
    path('me/schedule', views.MyScheduleView.as_view(), name='my-schedule'),

    # Admin
    path('admin/events', views.AdminEventListCreateView.as_view(), name='admin-events'),
    path('admin/events/<int:pk>', views.AdminEventDetailView.as_view(), name='admin-event-detail'),
    path('admin/event-types', views.AdminEventTypeListCreateView.as_view(), name='admin-event-types'),
    path('admin/event-types/<int:pk>', views.AdminEventTypeDetailView.as_view(), name='admin-event-type-detail'),
]
