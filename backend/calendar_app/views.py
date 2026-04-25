from rest_framework import generics, permissions
from .models import OlympiadEventType, OlympiadEvent
from .serializers import OlympiadEventTypeSerializer, OlympiadEventSerializer
from core.permissions import IsAdmin


# Student views
class EventListView(generics.ListAPIView):
    """List all olympiad events (for students)."""
    serializer_class = OlympiadEventSerializer
    queryset = OlympiadEvent.objects.all()

    def get_queryset(self):
        qs = super().get_queryset()
        start = self.request.query_params.get('start_date')
        end = self.request.query_params.get('end_date')
        event_type = self.request.query_params.get('event_type')
        if start:
            qs = qs.filter(start_date__gte=start)
        if end:
            qs = qs.filter(start_date__lte=end)
        if event_type:
            qs = qs.filter(event_type_id=event_type)
        return qs


class EventTypeListView(generics.ListAPIView):
    """List all event types."""
    serializer_class = OlympiadEventTypeSerializer
    queryset = OlympiadEventType.objects.all()


# Admin views
class AdminEventListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdmin]
    serializer_class = OlympiadEventSerializer
    queryset = OlympiadEvent.objects.all()


class AdminEventDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdmin]
    serializer_class = OlympiadEventSerializer
    queryset = OlympiadEvent.objects.all()


class AdminEventTypeListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdmin]
    serializer_class = OlympiadEventTypeSerializer
    queryset = OlympiadEventType.objects.all()


class AdminEventTypeDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdmin]
    serializer_class = OlympiadEventTypeSerializer
    queryset = OlympiadEventType.objects.all()
