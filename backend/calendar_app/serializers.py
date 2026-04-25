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
