from rest_framework import serializers
from .models import Homework, Problem, ProblemOption, ProblemAttachment, Submission, Tag


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name', 'slug']


class TagWithCountSerializer(serializers.ModelSerializer):
    problem_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Tag
        fields = ['id', 'name', 'slug', 'problem_count']


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


def _problem_status_from_submission(sub, problem):
    """Derive a student's status for a problem from their latest submission."""
    if sub is None:
        return 'not_started'
    if problem.answer_type == 'text' and sub.is_correct is None:
        return 'pending'
    if sub.is_correct is True:
        return 'correct'
    if sub.score is not None and 0 < sub.score < problem.max_score:
        return 'partial'
    if sub.is_correct is False:
        return 'wrong'
    return 'pending'


class ProblemSerializer(serializers.ModelSerializer):
    """Problem serializer for students - hides correct answers."""
    options = ProblemOptionSerializer(many=True, read_only=True)
    attachments = ProblemAttachmentSerializer(many=True, read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    latest_submission = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    solution = serializers.SerializerMethodField()
    lesson_id = serializers.SerializerMethodField()
    course_id = serializers.SerializerMethodField()

    class Meta:
        model = Problem
        fields = ['id', 'order', 'title', 'statement', 'answer_type', 'max_score',
                  'hint', 'level', 'source', 'tags', 'options', 'attachments',
                  'status', 'solution', 'lesson_id', 'course_id', 'latest_submission']

    def _get_latest_submission_obj(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Submission.objects.filter(
                user=request.user, problem=obj
            ).order_by('-submitted_at').first()
        return None

    def get_latest_submission(self, obj):
        sub = self._get_latest_submission_obj(obj)
        if sub:
            return SubmissionSerializer(sub).data
        return None

    def get_status(self, obj):
        return _problem_status_from_submission(self._get_latest_submission_obj(obj), obj)

    def get_solution(self, obj):
        # Only reveal the solution once the student has submitted at least once.
        if self._get_latest_submission_obj(obj) is not None:
            return obj.solution
        return ''

    def get_lesson_id(self, obj):
        if obj.homework_id and obj.homework and obj.homework.lesson_id:
            return obj.homework.lesson_id
        return None

    def get_course_id(self, obj):
        if obj.homework_id and obj.homework and obj.homework.lesson_id:
            return obj.homework.lesson.topic.block.course_id
        return None


class HomeworkSerializer(serializers.ModelSerializer):
    problems = ProblemSerializer(many=True, read_only=True)
    lesson_title = serializers.CharField(source='lesson.title', read_only=True)

    class Meta:
        model = Homework
        fields = ['id', 'title', 'lesson', 'lesson_title', 'due_date', 'problems',
                  'created_at', 'updated_at']


class SubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Submission
        fields = ['id', 'user', 'problem', 'answer', 'is_auto_checked',
                  'is_correct', 'score', 'admin_comment', 'submitted_at', 'checked_at']
        read_only_fields = ['id', 'user', 'is_auto_checked', 'is_correct',
                           'score', 'admin_comment', 'submitted_at', 'checked_at']


class HomeworkOverviewSerializer(serializers.Serializer):
    """Aggregate view of a homework for the «Домашние задания» dashboard."""
    lesson_id = serializers.IntegerField()
    lesson_title = serializers.CharField()
    course_id = serializers.IntegerField()
    course_title = serializers.CharField()
    homework_id = serializers.IntegerField()
    title = serializers.CharField()
    due_date = serializers.DateTimeField()
    problem_count = serializers.IntegerField()
    status = serializers.CharField()


class SubmitAnswerSerializer(serializers.Serializer):
    answer = serializers.JSONField()


class GradeSubmissionSerializer(serializers.Serializer):
    score = serializers.IntegerField(min_value=0)
    admin_comment = serializers.CharField(required=False, allow_blank=True, default='')
    is_correct = serializers.BooleanField(required=False, default=None)


# Admin serializers
class AdminTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = '__all__'


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
    tag_details = TagSerializer(source='tags', many=True, read_only=True)

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
