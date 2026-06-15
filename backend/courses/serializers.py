from rest_framework import serializers

from homework.models import Submission, Problem
from .models import (
    Course, Enrollment, Block, Topic, Lesson, LessonMaterial, LessonProgress,
)


def _problem_status(problem, submission):
    """Derive a single problem status from its latest submission.

    no submission -> 'not_started'; text & is_correct is None -> 'pending';
    is_correct True -> 'correct'; is_correct False -> 'wrong';
    0 < score < max_score -> 'partial'.
    """
    if submission is None:
        return 'not_started'
    if problem.answer_type == 'text' and submission.is_correct is None:
        return 'pending'
    if submission.is_correct is True:
        return 'correct'
    if submission.is_correct is False:
        return 'wrong'
    if submission.score is not None and 0 < submission.score < problem.max_score:
        return 'partial'
    if submission.score is not None and submission.score >= problem.max_score:
        return 'correct'
    return 'pending'


class LessonListSerializer(serializers.ModelSerializer):
    has_homework = serializers.SerializerMethodField()
    is_watched = serializers.SerializerMethodField()
    homework_status = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = ['id', 'title', 'lesson_type', 'lesson_date', 'is_published',
                  'order', 'has_homework', 'is_watched', 'homework_status']

    def get_has_homework(self, obj):
        return hasattr(obj, 'homework')

    def get_is_watched(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return LessonProgress.objects.filter(
                user=request.user, lesson=obj, is_watched=True
            ).exists()
        return False

    def get_homework_status(self, obj):
        """Aggregate the user's progress over this lesson's homework problems.

        'none' (no homework), 'not_started', 'pending', 'done', 'wrong',
        'in_progress'.
        """
        if not hasattr(obj, 'homework'):
            return 'none'
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return 'not_started'

        problems = list(obj.homework.problems.all())
        if not problems:
            return 'none'

        statuses = []
        for problem in problems:
            sub = Submission.objects.filter(
                user=request.user, problem=problem
            ).order_by('-submitted_at').first()
            statuses.append(_problem_status(problem, sub))

        if all(s == 'not_started' for s in statuses):
            return 'not_started'
        if any(s == 'pending' for s in statuses):
            return 'pending'
        if all(s == 'correct' for s in statuses):
            return 'done'
        if any(s == 'wrong' for s in statuses) and not any(
            s in ('correct', 'partial') for s in statuses
        ):
            return 'wrong'
        return 'in_progress'


class LessonDetailSerializer(serializers.ModelSerializer):
    has_homework = serializers.SerializerMethodField()
    topic_title = serializers.CharField(source='topic.title', read_only=True)
    block_title = serializers.CharField(source='topic.block.title', read_only=True)
    course_id = serializers.IntegerField(source='topic.block.course_id', read_only=True)
    notes_file_url = serializers.SerializerMethodField()
    workbook_file_url = serializers.SerializerMethodField()
    is_watched = serializers.SerializerMethodField()
    materials = serializers.SerializerMethodField()
    prev_lesson_id = serializers.SerializerMethodField()
    next_lesson_id = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = ['id', 'title', 'lesson_type', 'lesson_date', 'video_provider',
                  'video_url', 'description', 'notes_file_url', 'workbook_file_url',
                  'materials', 'is_published', 'order', 'has_homework',
                  'topic_title', 'block_title', 'course_id', 'is_watched',
                  'prev_lesson_id', 'next_lesson_id',
                  'created_at', 'updated_at']

    def get_has_homework(self, obj):
        return hasattr(obj, 'homework')

    def _build_file_url(self, file_field):
        if file_field:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(file_field.url)
            return file_field.url
        return None

    def get_notes_file_url(self, obj):
        return self._build_file_url(obj.notes_file)

    def get_workbook_file_url(self, obj):
        return self._build_file_url(obj.workbook_file)

    def get_materials(self, obj):
        return [
            {
                'id': m.id,
                'title': m.title,
                'kind': m.kind,
                'file_url': self._build_file_url(m.file),
            }
            for m in obj.materials.all()
        ]

    def get_is_watched(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return LessonProgress.objects.filter(
                user=request.user, lesson=obj, is_watched=True
            ).exists()
        return False

    def _get_all_course_lessons(self, obj):
        """Get all published lessons in the course, ordered by block->topic->lesson order."""
        course = obj.topic.block.course
        return Lesson.objects.filter(
            topic__block__course=course,
            is_published=True
        ).order_by('topic__block__order', 'topic__order', 'order')

    def get_prev_lesson_id(self, obj):
        lessons = list(self._get_all_course_lessons(obj).values_list('id', flat=True))
        try:
            idx = lessons.index(obj.id)
            if idx > 0:
                return lessons[idx - 1]
        except ValueError:
            pass
        return None

    def get_next_lesson_id(self, obj):
        lessons = list(self._get_all_course_lessons(obj).values_list('id', flat=True))
        try:
            idx = lessons.index(obj.id)
            if idx < len(lessons) - 1:
                return lessons[idx + 1]
        except ValueError:
            pass
        return None


class TopicSerializer(serializers.ModelSerializer):
    lessons = LessonListSerializer(many=True, read_only=True)

    class Meta:
        model = Topic
        fields = ['id', 'title', 'description', 'order', 'lessons']


class BlockSerializer(serializers.ModelSerializer):
    topics = TopicSerializer(many=True, read_only=True)

    class Meta:
        model = Block
        fields = ['id', 'title', 'description', 'order', 'topics']


class CourseListSerializer(serializers.ModelSerializer):
    progress = serializers.SerializerMethodField()
    lessons_total = serializers.SerializerMethodField()
    lessons_completed = serializers.SerializerMethodField()
    next_lesson = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = ['id', 'title', 'slug', 'description', 'cover_image', 'is_published',
                  'progress', 'lessons_total', 'lessons_completed', 'next_lesson',
                  'created_at', 'updated_at']

    def _published_lessons(self, obj):
        return Lesson.objects.filter(
            topic__block__course=obj, is_published=True
        )

    def get_lessons_total(self, obj):
        return self._published_lessons(obj).count()

    def get_lessons_completed(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return 0
        return LessonProgress.objects.filter(
            user=request.user,
            lesson__topic__block__course=obj,
            lesson__is_published=True,
            is_watched=True
        ).count()

    def get_next_lesson(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None
        watched_ids = set(LessonProgress.objects.filter(
            user=request.user,
            lesson__topic__block__course=obj,
            is_watched=True
        ).values_list('lesson_id', flat=True))
        lessons = self._published_lessons(obj).order_by(
            'topic__block__order', 'topic__order', 'order'
        ).values('id', 'title')
        for lesson in lessons:
            if lesson['id'] not in watched_ids:
                return {'id': lesson['id'], 'title': lesson['title']}
        return None

    def get_progress(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None
        try:
            enrollment = Enrollment.objects.get(user=request.user, course=obj)
            if enrollment.manual_progress_override is not None:
                return enrollment.manual_progress_override
        except Enrollment.DoesNotExist:
            return None

        total = Lesson.objects.filter(
            topic__block__course=obj, is_published=True
        ).count()
        if total == 0:
            return 0
        watched = LessonProgress.objects.filter(
            user=request.user,
            lesson__topic__block__course=obj,
            is_watched=True
        ).count()
        return round(watched / total * 100)


class CourseDetailSerializer(serializers.ModelSerializer):
    blocks = BlockSerializer(many=True, read_only=True)
    progress = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = ['id', 'title', 'slug', 'description', 'cover_image', 'is_published',
                  'blocks', 'progress', 'created_at', 'updated_at']

    def get_progress(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None
        try:
            enrollment = Enrollment.objects.get(user=request.user, course=obj)
            if enrollment.manual_progress_override is not None:
                return enrollment.manual_progress_override
        except Enrollment.DoesNotExist:
            return None

        total = Lesson.objects.filter(
            topic__block__course=obj, is_published=True
        ).count()
        if total == 0:
            return 0
        watched = LessonProgress.objects.filter(
            user=request.user,
            lesson__topic__block__course=obj,
            is_watched=True
        ).count()
        return round(watched / total * 100)


class EnrollmentSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source='course.title', read_only=True)
    course_slug = serializers.CharField(source='course.slug', read_only=True)

    class Meta:
        model = Enrollment
        fields = ['id', 'user', 'course', 'course_title', 'course_slug',
                  'granted_at', 'manual_progress_override']


# Admin serializers
class AdminCourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = '__all__'


class AdminBlockSerializer(serializers.ModelSerializer):
    class Meta:
        model = Block
        fields = '__all__'


class AdminTopicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Topic
        fields = '__all__'


class AdminLessonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = '__all__'


class AdminLessonMaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = LessonMaterial
        fields = '__all__'


class AdminEnrollmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Enrollment
        fields = '__all__'
