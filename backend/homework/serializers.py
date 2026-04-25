from rest_framework import serializers
from .models import Homework, Problem, ProblemOption, ProblemAttachment, Submission


class ProblemOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProblemOption
        fields = ['id', 'text', 'order']


class ProblemAttachmentSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = ProblemAttachment
        fields = ['id', 'file_url']

    def get_file_url(self, obj):
        request = self.context.get('request')
        if request and obj.file:
            return request.build_absolute_uri(obj.file.url)
        return obj.file.url if obj.file else None


class ProblemSerializer(serializers.ModelSerializer):
    """Problem serializer for students - hides correct answers."""
    options = ProblemOptionSerializer(many=True, read_only=True)
    attachments = ProblemAttachmentSerializer(many=True, read_only=True)
    latest_submission = serializers.SerializerMethodField()

    class Meta:
        model = Problem
        fields = ['id', 'order', 'statement', 'answer_type', 'max_score',
                  'hint', 'options', 'attachments', 'latest_submission']

    def get_latest_submission(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            sub = Submission.objects.filter(
                user=request.user, problem=obj
            ).order_by('-submitted_at').first()
            if sub:
                return SubmissionSerializer(sub).data
        return None


class HomeworkSerializer(serializers.ModelSerializer):
    problems = ProblemSerializer(many=True, read_only=True)
    lesson_title = serializers.CharField(source='lesson.title', read_only=True)

    class Meta:
        model = Homework
        fields = ['id', 'title', 'lesson', 'lesson_title', 'problems',
                  'created_at', 'updated_at']


class SubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Submission
        fields = ['id', 'user', 'problem', 'answer', 'is_auto_checked',
                  'is_correct', 'score', 'admin_comment', 'submitted_at', 'checked_at']
        read_only_fields = ['id', 'user', 'is_auto_checked', 'is_correct',
                           'score', 'admin_comment', 'submitted_at', 'checked_at']


class SubmitAnswerSerializer(serializers.Serializer):
    answer = serializers.JSONField()


class GradeSubmissionSerializer(serializers.Serializer):
    score = serializers.IntegerField(min_value=0)
    admin_comment = serializers.CharField(required=False, allow_blank=True, default='')
    is_correct = serializers.BooleanField(required=False, default=None)


# Admin serializers
class AdminProblemOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProblemOption
        fields = '__all__'


class AdminProblemAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProblemAttachment
        fields = '__all__'


class AdminProblemSerializer(serializers.ModelSerializer):
    options = AdminProblemOptionSerializer(many=True, read_only=True)
    attachments = AdminProblemAttachmentSerializer(many=True, read_only=True)

    class Meta:
        model = Problem
        fields = '__all__'


class AdminHomeworkSerializer(serializers.ModelSerializer):
    problems = AdminProblemSerializer(many=True, read_only=True)

    class Meta:
        model = Homework
        fields = '__all__'


class AdminSubmissionSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_full_name = serializers.CharField(source='user.full_name', read_only=True)
    problem_order = serializers.IntegerField(source='problem.order', read_only=True)
    lesson_title = serializers.CharField(source='problem.homework.lesson.title', read_only=True)
    course_title = serializers.CharField(source='problem.homework.lesson.topic.block.course.title', read_only=True)

    class Meta:
        model = Submission
        fields = '__all__'
