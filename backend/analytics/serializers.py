# Analytics is a read-only aggregation app. Responses are assembled as plain
# dicts in views.py (no model-backed serializers are required), but the small
# helper serializers below document the canonical response shapes and can be
# reused by the frontend / schema generators if desired.
from rest_framework import serializers


class TopicStatSerializer(serializers.Serializer):
    tag = serializers.CharField()
    slug = serializers.CharField()
    attempted = serializers.IntegerField()
    correct = serializers.IntegerField()
    accuracy = serializers.IntegerField()


class LevelStatSerializer(serializers.Serializer):
    level = serializers.CharField()
    label = serializers.CharField()
    attempted = serializers.IntegerField()
    correct = serializers.IntegerField()
    accuracy = serializers.IntegerField()


class AnswerTypeStatSerializer(serializers.Serializer):
    answer_type = serializers.CharField()
    attempted = serializers.IntegerField()
    correct = serializers.IntegerField()


class RecentActivitySerializer(serializers.Serializer):
    date = serializers.CharField()
    count = serializers.IntegerField()


class MeStatsSerializer(serializers.Serializer):
    total_submissions = serializers.IntegerField()
    solved_problems = serializers.IntegerField()
    total_attempted = serializers.IntegerField()
    accuracy = serializers.IntegerField()
    lessons_watched = serializers.IntegerField()
    lessons_total = serializers.IntegerField()
    by_topic = TopicStatSerializer(many=True)
    by_level = LevelStatSerializer(many=True)
    by_answer_type = AnswerTypeStatSerializer(many=True)
    recent_activity = RecentActivitySerializer(many=True)
    mock_attempts = serializers.IntegerField()
    best_mock_percent = serializers.IntegerField()
    strengths = serializers.ListField(child=serializers.CharField())
    weaknesses = serializers.ListField(child=serializers.CharField())


class RecommendationItemSerializer(serializers.Serializer):
    type = serializers.CharField()
    title = serializers.CharField()
    reason = serializers.CharField()
    action_url = serializers.CharField()
    priority = serializers.IntegerField()
    tag = serializers.CharField(required=False)


class RecommendationsSerializer(serializers.Serializer):
    generated_by = serializers.CharField()
    items = RecommendationItemSerializer(many=True)
