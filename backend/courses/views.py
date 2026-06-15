from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .models import (
    Course, Enrollment, Block, Topic, Lesson, LessonMaterial, LessonProgress,
)
from .serializers import (
    CourseListSerializer, CourseDetailSerializer, LessonDetailSerializer,
    EnrollmentSerializer, AdminCourseSerializer, AdminBlockSerializer,
    AdminTopicSerializer, AdminLessonSerializer, AdminLessonMaterialSerializer,
    AdminEnrollmentSerializer,
)
from core.permissions import IsAdmin


# Student views
class MyCoursesView(generics.ListAPIView):
    """List courses the current user is enrolled in."""
    serializer_class = CourseListSerializer

    def get_queryset(self):
        enrolled_course_ids = Enrollment.objects.filter(
            user=self.request.user
        ).values_list('course_id', flat=True)
        return Course.objects.filter(
            id__in=enrolled_course_ids,
            is_published=True
        ).order_by('-updated_at')


class CourseDetailView(generics.RetrieveAPIView):
    """Get course details with blocks/topics/lessons hierarchy."""
    serializer_class = CourseDetailSerializer

    def get_queryset(self):
        enrolled_course_ids = Enrollment.objects.filter(
            user=self.request.user
        ).values_list('course_id', flat=True)
        return Course.objects.filter(id__in=enrolled_course_ids, is_published=True)


class LessonDetailView(generics.RetrieveAPIView):
    """Get lesson details."""
    serializer_class = LessonDetailSerializer

    def get_queryset(self):
        enrolled_course_ids = Enrollment.objects.filter(
            user=self.request.user
        ).values_list('course_id', flat=True)
        return Lesson.objects.filter(
            topic__block__course_id__in=enrolled_course_ids,
            is_published=True
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def my_materials(request):
    """All downloadable materials across the student's enrolled, published lessons.

    Powers the «Материалы» page. Includes LessonMaterial rows plus synthetic
    items for each lesson's notes_file / workbook_file. Supports `q` (search
    title) and `kind` filters.
    """
    enrolled_course_ids = Enrollment.objects.filter(
        user=request.user
    ).values_list('course_id', flat=True)
    lessons = Lesson.objects.filter(
        topic__block__course_id__in=enrolled_course_ids,
        is_published=True
    ).select_related('topic__block__course').prefetch_related('materials')

    q = request.query_params.get('q', '').strip().lower()
    kind = request.query_params.get('kind', '').strip()

    def build_file_url(file_field):
        if not file_field:
            return None
        return request.build_absolute_uri(file_field.url)

    items = []
    for lesson in lessons:
        course = lesson.topic.block.course
        base = {
            'lesson_id': lesson.id,
            'lesson_title': lesson.title,
            'course_id': course.id,
            'course_title': course.title,
        }
        # Real LessonMaterial rows
        for m in lesson.materials.all():
            items.append({
                'id': f'material-{m.id}',
                'title': m.title,
                'kind': m.kind,
                'file_url': build_file_url(m.file),
                **base,
            })
        # Synthetic items for lesson-level files
        if lesson.notes_file:
            items.append({
                'id': f'notes-{lesson.id}',
                'title': f'Конспект: {lesson.title}',
                'kind': 'notes',
                'file_url': build_file_url(lesson.notes_file),
                **base,
            })
        if lesson.workbook_file:
            items.append({
                'id': f'workbook-{lesson.id}',
                'title': f'Рабочая тетрадь: {lesson.title}',
                'kind': 'other',
                'file_url': build_file_url(lesson.workbook_file),
                **base,
            })

    if kind:
        items = [i for i in items if i['kind'] == kind]
    if q:
        items = [i for i in items if q in i['title'].lower()]

    return Response(items)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_lesson_watched(request, pk):
    """Toggle lesson watched status."""
    try:
        enrolled_course_ids = Enrollment.objects.filter(
            user=request.user
        ).values_list('course_id', flat=True)
        lesson = Lesson.objects.get(
            pk=pk,
            topic__block__course_id__in=enrolled_course_ids,
            is_published=True
        )
    except Lesson.DoesNotExist:
        return Response({'detail': 'Занятие не найдено.'}, status=404)

    progress, created = LessonProgress.objects.get_or_create(
        user=request.user, lesson=lesson
    )
    progress.is_watched = not progress.is_watched
    if progress.is_watched:
        progress.watched_at = timezone.now()
    else:
        progress.watched_at = None
    progress.save()

    return Response({
        'is_watched': progress.is_watched,
        'watched_at': progress.watched_at,
    })


# Admin views
class AdminCourseListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdmin]
    serializer_class = AdminCourseSerializer
    queryset = Course.objects.all()
    search_fields = ['title', 'slug']


class AdminCourseDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdmin]
    serializer_class = AdminCourseSerializer
    queryset = Course.objects.all()


class AdminBlockListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdmin]
    serializer_class = AdminBlockSerializer
    queryset = Block.objects.all()
    filterset_fields = ['course']


class AdminBlockDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdmin]
    serializer_class = AdminBlockSerializer
    queryset = Block.objects.all()


class AdminTopicListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdmin]
    serializer_class = AdminTopicSerializer
    queryset = Topic.objects.all()
    filterset_fields = ['block', 'block__course']


class AdminTopicDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdmin]
    serializer_class = AdminTopicSerializer
    queryset = Topic.objects.all()


class AdminLessonListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdmin]
    serializer_class = AdminLessonSerializer
    queryset = Lesson.objects.all()
    filterset_fields = ['topic', 'topic__block', 'topic__block__course', 'is_published']


class AdminLessonDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdmin]
    serializer_class = AdminLessonSerializer
    queryset = Lesson.objects.all()


class AdminLessonMaterialListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdmin]
    serializer_class = AdminLessonMaterialSerializer
    queryset = LessonMaterial.objects.all()
    filterset_fields = ['lesson', 'kind']
    search_fields = ['title']


class AdminLessonMaterialDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdmin]
    serializer_class = AdminLessonMaterialSerializer
    queryset = LessonMaterial.objects.all()


@api_view(['POST'])
@permission_classes([IsAdmin])
def admin_enroll_user(request, user_id):
    """Grant user access to a course."""
    course_id = request.data.get('course_id')
    if not course_id:
        return Response({'detail': 'course_id обязателен.'}, status=400)

    enrollment, created = Enrollment.objects.get_or_create(
        user_id=user_id, course_id=course_id
    )
    if not created:
        return Response({'detail': 'Доступ уже выдан.'}, status=400)

    return Response(EnrollmentSerializer(enrollment).data, status=201)


@api_view(['DELETE'])
@permission_classes([IsAdmin])
def admin_unenroll_user(request, user_id, course_id):
    """Revoke user access to a course."""
    try:
        enrollment = Enrollment.objects.get(user_id=user_id, course_id=course_id)
        enrollment.delete()
        return Response(status=204)
    except Enrollment.DoesNotExist:
        return Response({'detail': 'Доступ не найден.'}, status=404)


class AdminEnrollmentListView(generics.ListAPIView):
    permission_classes = [IsAdmin]
    serializer_class = AdminEnrollmentSerializer
    queryset = Enrollment.objects.all()
    filterset_fields = ['user', 'course']


class AdminEnrollmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdmin]
    serializer_class = AdminEnrollmentSerializer
    queryset = Enrollment.objects.all()
