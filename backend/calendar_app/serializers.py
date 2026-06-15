from rest_framework import serializers
from .models import OlympiadEventType, OlympiadEvent


class OlympiadEventTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = OlympiadEventType
        fields = '__all__'


class OlympiadEventSerializer(serializers.ModelSerializer):
    event_type_name = serializers.CharField(source='event_type.name', read_only=True)
    event_type_color = serializers.CharField(source='event_type.color', read_only=True)

    class Meta:
        model = OlympiadEvent
        fields = ['id', 'title', 'event_type', 'event_type_name', 'event_type_color',
                  'start_date', 'end_date', 'time', 'description', 'external_url',
                  'created_at', 'updated_at']


class ScheduleItemSerializer(serializers.Serializer):
    """Unified schedule feed item. Shape varies by `kind`:

    olympiad -> {kind, id, date, time, title, event_type, color, external_url}
    homework -> {kind, date, title, lesson_id, course_id, status}
    lesson   -> {kind, date, title, lesson_id, course_id, lesson_type}
    """
    kind = serializers.CharField()
    date = serializers.DateField()
    title = serializers.CharField()
    # olympiad-specific
    id = serializers.IntegerField(required=False)
    time = serializers.TimeField(required=False, allow_null=True)
    event_type = serializers.CharField(required=False, allow_null=True)
    color = serializers.CharField(required=False, allow_null=True)
    external_url = serializers.CharField(required=False, allow_null=True)
    # homework / lesson-specific
    lesson_id = serializers.IntegerField(required=False)
    course_id = serializers.IntegerField(required=False)
    status = serializers.CharField(required=False)
    lesson_type = serializers.CharField(required=False)
