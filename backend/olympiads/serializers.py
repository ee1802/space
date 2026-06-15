from rest_framework import serializers

from homework.models import ProblemOption
from .models import MockOlympiad, MockProblem, MockAttempt, MockAnswer


class SafeProblemOptionSerializer(serializers.ModelSerializer):
    """Option as shown to a student — never reveals is_correct."""
    class Meta:
        model = ProblemOption
        fields = ['id', 'text', 'order']


class SafeProblemSerializer(serializers.Serializer):
    """
    Safe student view of a homework.Problem inside a mock attempt.
    NEVER includes correct_answer, options.is_correct, hint or solution.
    """
    id = serializers.IntegerField()
    order = serializers.IntegerField()
    title = serializers.CharField()
    statement = serializers.CharField()
    answer_type = serializers.CharField()
    max_score = serializers.IntegerField()
    options = SafeProblemOptionSerializer(many=True, read_only=True)


class MockOlympiadListSerializer(serializers.ModelSerializer):
    problem_count = serializers.SerializerMethodField()
    my_best_score = serializers.SerializerMethodField()
    my_attempts_count = serializers.SerializerMethodField()

    class Meta:
        model = MockOlympiad
        fields = ['id', 'title', 'description', 'level', 'duration_minutes',
                  'problem_count', 'my_best_score', 'my_attempts_count']

    def get_problem_count(self, obj):
        return obj.mock_problems.count()

    def _my_attempts(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.attempts.filter(user=request.user)
        return MockAttempt.objects.none()

    def get_my_best_score(self, obj):
        scores = self._my_attempts(obj).filter(
            is_completed=True, score__isnull=False
        ).values_list('score', flat=True)
        return max(scores) if scores else None

    def get_my_attempts_count(self, obj):
        return self._my_attempts(obj).count()


class MockOlympiadDetailSerializer(MockOlympiadListSerializer):
    active_attempt_id = serializers.SerializerMethodField()

    class Meta(MockOlympiadListSerializer.Meta):
        fields = MockOlympiadListSerializer.Meta.fields + ['active_attempt_id']

    def get_active_attempt_id(self, obj):
        from django.utils import timezone
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            attempt = obj.attempts.filter(
                user=request.user,
                is_completed=False,
                deadline__gt=timezone.now(),
            ).order_by('-started_at').first()
            if attempt:
                return attempt.id
        return None


class MockAttemptHistorySerializer(serializers.ModelSerializer):
    mock_title = serializers.CharField(source='mock.title', read_only=True)
    percent = serializers.SerializerMethodField()

    class Meta:
        model = MockAttempt
        fields = ['id', 'mock_title', 'started_at', 'finished_at',
                  'is_completed', 'score', 'max_score', 'percent']

    def get_percent(self, obj):
        if obj.score is not None and obj.max_score:
            return round(obj.score / obj.max_score * 100, 1)
        return None
