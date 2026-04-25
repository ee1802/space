from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .models import Course, Enrollment, Block, Topic, Lesson, LessonProgress
from .serializers import (
    CourseListSerializer, CourseDetailSerializer, LessonDetailSerializer,
    EnrollmentSerializer, AdminCourseSerializer, AdminBlockSerializer,
    AdminTopicSerializer, AdminLessonSerializer, AdminEnrollmentSerializer,
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
