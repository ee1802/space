from rest_framework import serializers

from .models import Favorite, LessonRating, Question


class FavoriteLessonSerializer(serializers.ModelSerializer):
    """A favorited lesson entry for the «избранное» list."""
    lesson_id = serializers.IntegerField(source='lesson.id', read_only=True)
    title = serializers.CharField(source='lesson.title', read_only=True)
    course_id = serializers.IntegerField(source='lesson.topic.block.course_id', read_only=True)

    class Meta:
        model = Favorite
        fields = ['id', 'lesson_id', 'title', 'course_id']


class FavoriteProblemSerializer(serializers.ModelSerializer):
    """A favorited problem entry for the «избранное» list."""
    problem_id = serializers.IntegerField(source='problem.id', read_only=True)
    title = serializers.SerializerMethodField()
    statement_excerpt = serializers.SerializerMethodField()
    level = serializers.CharField(source='problem.level', read_only=True)

    class Meta:
        model = Favorite
        fields = ['id', 'problem_id', 'title', 'statement_excerpt', 'level']

    def get_title(self, obj):
        return obj.problem.title or ''

    def get_statement_excerpt(self, obj):
        statement = obj.problem.statement or ''
        if len(statement) > 160:
            return statement[:160].rstrip() + '…'
        return statement


class ToggleFavoriteSerializer(serializers.Serializer):
    lesson_id = serializers.IntegerField(required=False)
    problem_id = serializers.IntegerField(required=False)

    def validate(self, attrs):
        if bool(attrs.get('lesson_id')) == bool(attrs.get('problem_id')):
            raise serializers.ValidationError(
                {'detail': 'Укажите ровно один из параметров: lesson_id или problem_id.'}
            )
        return attrs


class LessonRatingSerializer(serializers.ModelSerializer):
    class Meta:
        model = LessonRating
        fields = ['id', 'lesson', 'rating', 'comment', 'created_at', 'updated_at']
        read_only_fields = ['id', 'lesson', 'created_at', 'updated_at']


class RateLessonSerializer(serializers.Serializer):
    rating = serializers.IntegerField(min_value=1, max_value=5)
    comment = serializers.CharField(required=False, allow_blank=True, default='')


class QuestionSerializer(serializers.ModelSerializer):
    """A student's question to the teacher/curator."""
    lesson_id = serializers.IntegerField(source='lesson.id', read_only=True)
    lesson_title = serializers.CharField(source='lesson.title', read_only=True, default=None)
    problem_id = serializers.IntegerField(source='problem.id', read_only=True)

    class Meta:
        model = Question
        fields = ['id', 'lesson_id', 'lesson_title', 'problem_id', 'text',
                  'answer', 'is_answered', 'answered_at', 'created_at']


class CreateQuestionSerializer(serializers.Serializer):
    lesson_id = serializers.IntegerField(required=False)
    problem_id = serializers.IntegerField(required=False)
    text = serializers.CharField()

    def validate(self, attrs):
        if bool(attrs.get('lesson_id')) == bool(attrs.get('problem_id')):
            raise serializers.ValidationError(
                {'detail': 'Укажите ровно один из параметров: lesson_id или problem_id.'}
            )
        return attrs


class AdminQuestionSerializer(serializers.ModelSerializer):
    """Full question view for admins/curators."""
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_full_name = serializers.CharField(source='user.full_name', read_only=True)
    lesson_title = serializers.CharField(source='lesson.title', read_only=True, default=None)
    answered_by_name = serializers.CharField(source='answered_by.full_name', read_only=True, default=None)

    class Meta:
        model = Question
        fields = ['id', 'user', 'user_email', 'user_full_name', 'lesson', 'lesson_title',
                  'problem', 'text', 'answer', 'answered_by', 'answered_by_name',
                  'answered_at', 'is_answered', 'created_at', 'updated_at']


class AnswerQuestionSerializer(serializers.Serializer):
    answer = serializers.CharField()
