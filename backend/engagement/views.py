from django.db.models import Avg
from django.utils import timezone
from rest_framework import generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from courses.models import Enrollment, Lesson
from homework.models import Problem
from core.permissions import IsAdmin
from .models import Favorite, LessonRating, Question
from .serializers import (
    FavoriteLessonSerializer, FavoriteProblemSerializer, ToggleFavoriteSerializer,
    LessonRatingSerializer, RateLessonSerializer,
    QuestionSerializer, CreateQuestionSerializer,
    AdminQuestionSerializer, AnswerQuestionSerializer,
)


def get_accessible_lesson(user, lesson_id):
    """Return a published lesson from one of the user's enrolled courses, or None."""
    enrolled_course_ids = Enrollment.objects.filter(
        user=user
    ).values_list('course_id', flat=True)
    return Lesson.objects.filter(
        pk=lesson_id,
        topic__block__course_id__in=enrolled_course_ids,
        is_published=True,
    ).first()


def get_accessible_problem(user, problem_id):
    """
    Return a problem the user may engage with, or None.

    A problem is accessible if it belongs to a published lesson in one of the
    user's enrolled courses, or if it lives in the public problem bank.
    """
    enrolled_course_ids = Enrollment.objects.filter(
        user=user
    ).values_list('course_id', flat=True)
    problem = Problem.objects.filter(
        pk=problem_id,
        homework__lesson__topic__block__course_id__in=enrolled_course_ids,
        homework__lesson__is_published=True,
    ).first()
    if problem:
        return problem
    return Problem.objects.filter(pk=problem_id, in_bank=True).first()


# Favorites (избранное)
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def my_favorites(request):
    """List the current user's favorites, split into lessons and problems."""
    lesson_favs = Favorite.objects.filter(
        user=request.user, lesson__isnull=False
    ).select_related('lesson__topic__block__course')
    problem_favs = Favorite.objects.filter(
        user=request.user, problem__isnull=False
    ).select_related('problem')

    return Response({
        'lessons': FavoriteLessonSerializer(lesson_favs, many=True, context={'request': request}).data,
        'problems': FavoriteProblemSerializer(problem_favs, many=True, context={'request': request}).data,
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def toggle_favorite(request):
    """Toggle a lesson or problem in the current user's favorites."""
    serializer = ToggleFavoriteSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    lesson_id = serializer.validated_data.get('lesson_id')
    problem_id = serializer.validated_data.get('problem_id')

    if lesson_id:
        lesson = get_accessible_lesson(request.user, lesson_id)
        if not lesson:
            return Response({'detail': 'Занятие не найдено.'}, status=404)
        fav = Favorite.objects.filter(user=request.user, lesson=lesson).first()
        if fav:
            fav.delete()
            return Response({'favorited': False})
        fav = Favorite.objects.create(user=request.user, lesson=lesson)
        return Response({'favorited': True, 'id': fav.id}, status=201)

    problem = get_accessible_problem(request.user, problem_id)
    if not problem:
        return Response({'detail': 'Задача не найдена.'}, status=404)
    fav = Favorite.objects.filter(user=request.user, problem=problem).first()
    if fav:
        fav.delete()
        return Response({'favorited': False})
    fav = Favorite.objects.create(user=request.user, problem=problem)
    return Response({'favorited': True, 'id': fav.id}, status=201)


# Ratings (оценка урока)
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def rate_lesson(request, lesson_id):
    """Upsert the current user's rating for a lesson."""
    lesson = get_accessible_lesson(request.user, lesson_id)
    if not lesson:
        return Response({'detail': 'Занятие не найдено.'}, status=404)

    serializer = RateLessonSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    rating, _created = LessonRating.objects.update_or_create(
        user=request.user, lesson=lesson,
        defaults={
            'rating': serializer.validated_data['rating'],
            'comment': serializer.validated_data.get('comment', ''),
        },
    )
    return Response(LessonRatingSerializer(rating).data, status=200)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def lesson_rating(request, lesson_id):
    """Return the user's own rating plus the lesson's aggregate rating."""
    lesson = get_accessible_lesson(request.user, lesson_id)
    if not lesson:
        return Response({'detail': 'Занятие не найдено.'}, status=404)

    my = LessonRating.objects.filter(user=request.user, lesson=lesson).first()
    agg = LessonRating.objects.filter(lesson=lesson).aggregate(avg=Avg('rating'))
    count = LessonRating.objects.filter(lesson=lesson).count()

    return Response({
        'my_rating': {'rating': my.rating, 'comment': my.comment} if my else None,
        'average': round(agg['avg'], 2) if agg['avg'] is not None else None,
        'count': count,
    })


# Questions (вопросы преподавателю/куратору)
@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated])
def questions(request):
    """
    GET  /api/questions?lesson={id}|?problem={id}
        The current user's OWN questions for a lesson/problem, for display under
        it. Never leaks other students' questions.
    POST /api/questions  body {lesson_id?|problem_id?, text}
        Create a question to the teacher under an accessible lesson or problem.
    """
    if request.method == 'GET':
        qs = Question.objects.filter(user=request.user)
        lesson_id = request.query_params.get('lesson')
        problem_id = request.query_params.get('problem')
        if lesson_id:
            qs = qs.filter(lesson_id=lesson_id)
        if problem_id:
            qs = qs.filter(problem_id=problem_id)
        qs = qs.select_related('lesson').order_by('-created_at')
        return Response(QuestionSerializer(qs, many=True).data)

    serializer = CreateQuestionSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    lesson_id = serializer.validated_data.get('lesson_id')
    problem_id = serializer.validated_data.get('problem_id')

    lesson = None
    problem = None
    if lesson_id:
        lesson = get_accessible_lesson(request.user, lesson_id)
        if not lesson:
            return Response({'detail': 'Занятие не найдено.'}, status=404)
    else:
        problem = get_accessible_problem(request.user, problem_id)
        if not problem:
            return Response({'detail': 'Задача не найдена.'}, status=404)

    question = Question.objects.create(
        user=request.user,
        lesson=lesson,
        problem=problem,
        text=serializer.validated_data['text'],
    )
    return Response(QuestionSerializer(question).data, status=201)


class MyQuestionsView(generics.ListAPIView):
    """The current user's own questions, optionally filtered by lesson/problem."""
    serializer_class = QuestionSerializer
    filterset_fields = ['lesson', 'problem']

    def get_queryset(self):
        return Question.objects.filter(
            user=self.request.user
        ).select_related('lesson').order_by('-created_at')


# Admin questions
class AdminQuestionListView(generics.ListAPIView):
    permission_classes = [IsAdmin]
    serializer_class = AdminQuestionSerializer
    queryset = Question.objects.all().select_related('user', 'lesson', 'answered_by')
    filterset_fields = ['is_answered', 'lesson', 'problem', 'user']


@api_view(['POST'])
@permission_classes([IsAdmin])
def admin_answer_question(request, pk):
    """Answer a question (admin/curator)."""
    try:
        question = Question.objects.get(pk=pk)
    except Question.DoesNotExist:
        return Response({'detail': 'Вопрос не найден.'}, status=404)

    serializer = AnswerQuestionSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    question.answer = serializer.validated_data['answer']
    question.answered_by = request.user
    question.answered_at = timezone.now()
    question.is_answered = True
    question.save()

    return Response(AdminQuestionSerializer(question).data)
