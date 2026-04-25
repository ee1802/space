from rest_framework import serializers
from .models import Course, Enrollment, Block, Topic, Lesson, LessonProgress


class LessonListSerializer(serializers.ModelSerializer):
    has_homework = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = ['id', 'title', 'lesson_date', 'is_published', 'order', 'has_homework']

    def get_has_homework(self, obj):
        return hasattr(obj, 'homework')


class LessonDetailSerializer(serializers.ModelSerializer):
    has_homework = serializers.SerializerMethodField()
    topic_title = serializers.CharField(source='topic.title', read_only=True)
    block_title = serializers.CharField(source='topic.block.title', read_only=True)
    course_id = serializers.IntegerField(source='topic.block.course_id', read_only=True)
    notes_file_url = serializers.SerializerMethodField()
    workbook_file_url = serializers.SerializerMethodField()
    is_watched = serializers.SerializerMethodField()
    prev_lesson_id = serializers.SerializerMethodField()
    next_lesson_id = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = ['id', 'title', 'lesson_date', 'video_provider', 'video_url',
                  'description', 'notes_file_url', 'workbook_file_url',
                  'is_published', 'order', 'has_homework', 'topic_title',
                  'block_title', 'course_id', 'is_watched',
                  'prev_lesson_id', 'next_lesson_id',
                  'created_at', 'updated_at']

    def get_has_homework(self, obj):
        return hasattr(obj, 'homework')

    def get_notes_file_url(self, obj):
        if obj.notes_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.notes_file.url)
            return obj.notes_file.url
        return None

    def get_workbook_file_url(self, obj):
        if obj.workbook_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.workbook_file.url)
            return obj.workbook_file.url
        return None

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

    class Meta:
        model = Course
        fields = ['id', 'title', 'slug', 'description', 'cover_image', 'is_published',
                  'progress', 'created_at', 'updated_at']

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


class AdminEnrollmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Enrollment
        fields = '__all__'
