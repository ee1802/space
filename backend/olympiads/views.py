from datetime import timedelta

from django.utils import timezone
from rest_framework import generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from homework.grading import grade_answer
from homework.models import Problem
from .models import MockOlympiad, MockProblem, MockAttempt, MockAnswer
from .serializers import (
    MockOlympiadListSerializer, MockOlympiadDetailSerializer,
    SafeProblemSerializer, MockAttemptHistorySerializer,
)


def _safe_problems(mock):
    """Ordered list of homework.Problem for a mock, prefetched options."""
    links = (
        MockProblem.objects
        .filter(mock=mock)
        .select_related('problem')
        .prefetch_related('problem__options')
        .order_by('order')
    )
    return [link.problem for link in links]


def _safe_problems_data(mock):
    return SafeProblemSerializer(_safe_problems(mock), many=True).data


# 1. List published mock olympiads
class MockOlympiadListView(generics.ListAPIView):
    serializer_class = MockOlympiadListSerializer
    queryset = MockOlympiad.objects.filter(is_published=True)
    filterset_fields = ['level']
    search_fields = ['title', 'description']


# 2. Mock olympiad detail
class MockOlympiadDetailView(generics.RetrieveAPIView):
    serializer_class = MockOlympiadDetailSerializer
    queryset = MockOlympiad.objects.filter(is_published=True)


# 3. Start an attempt
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def start_attempt(request, pk):
    """Create (or resume) a timed attempt for a mock olympiad."""
    try:
        mock = MockOlympiad.objects.get(pk=pk, is_published=True)
    except MockOlympiad.DoesNotExist:
        return Response({'detail': 'Олимпиада не найдена.'}, status=404)

    now = timezone.now()
    attempt = MockAttempt.objects.filter(
        user=request.user,
        mock=mock,
        is_completed=False,
        deadline__gt=now,
    ).order_by('-started_at').first()

    if attempt is None:
        attempt = MockAttempt.objects.create(
            user=request.user,
            mock=mock,
            deadline=now + timedelta(minutes=mock.duration_minutes),
        )

    return Response({
        'attempt_id': attempt.id,
        'deadline': attempt.deadline,
        'duration_minutes': mock.duration_minutes,
        'problems': _safe_problems_data(mock),
    }, status=201)


# 4. Attempt state
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def attempt_detail(request, pk):
    """Return the current state of one of the user's attempts."""
    try:
        attempt = MockAttempt.objects.select_related('mock').get(
            pk=pk, user=request.user
        )
    except MockAttempt.DoesNotExist:
        return Response({'detail': 'Попытка не найдена.'}, status=404)

    mock = attempt.mock
    problems = _safe_problems(mock)
    answers = {a.problem_id: a for a in attempt.answers.all()}
    my_answers = {pid: a.answer for pid, a in answers.items()}

    data = {
        'id': attempt.id,
        'mock': mock.id,
        'mock_title': mock.title,
        'deadline': attempt.deadline,
        'finished_at': attempt.finished_at,
        'is_completed': attempt.is_completed,
        'server_now': timezone.now(),
        'problems': SafeProblemSerializer(problems, many=True).data,
        'my_answers': my_answers,
    }

    if attempt.is_completed:
        results = {}
        for problem in problems:
            ans = answers.get(problem.id)
            results[problem.id] = {
                'is_correct': ans.is_correct if ans else None,
                'score': ans.score if ans else None,
                'solution': problem.solution,
                'correct_answer': problem.correct_answer,
            }
        data['score'] = attempt.score
        data['max_score'] = attempt.max_score
        data['results'] = results

    return Response(data)


# 5. Save an answer
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def submit_attempt_answer(request, pk):
    """Upsert and grade one answer inside an attempt (correctness not revealed)."""
    try:
        attempt = MockAttempt.objects.select_related('mock').get(
            pk=pk, user=request.user
        )
    except MockAttempt.DoesNotExist:
        return Response({'detail': 'Попытка не найдена.'}, status=404)

    if attempt.is_completed:
        return Response({'detail': 'Попытка уже завершена.'}, status=400)
    if timezone.now() > attempt.deadline:
        return Response({'detail': 'Время вышло.'}, status=400)

    problem_id = request.data.get('problem_id')
    answer_data = request.data.get('answer')

    if problem_id is None:
        return Response({'detail': 'Не указана задача.'}, status=400)

    # Problem must belong to this mock.
    if not MockProblem.objects.filter(mock=attempt.mock, problem_id=problem_id).exists():
        return Response({'detail': 'Задача не входит в эту олимпиаду.'}, status=400)

    try:
        problem = Problem.objects.get(pk=problem_id)
    except Problem.DoesNotExist:
        return Response({'detail': 'Задача не найдена.'}, status=404)

    result = grade_answer(problem, answer_data)

    MockAnswer.objects.update_or_create(
        attempt=attempt,
        problem=problem,
        defaults={
            'answer': answer_data,
            'is_correct': result['is_correct'],
            'score': result['score'],
        },
    )

    return Response({'saved': True})


# 6. Finish an attempt
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def finish_attempt(request, pk):
    """Grade any ungraded answers, finalise the attempt and reveal results."""
    try:
        attempt = MockAttempt.objects.select_related('mock').get(
            pk=pk, user=request.user
        )
    except MockAttempt.DoesNotExist:
        return Response({'detail': 'Попытка не найдена.'}, status=404)

    problems = _safe_problems(attempt.mock)
    answers = {a.problem_id: a for a in attempt.answers.all()}

    total_score = 0
    max_score = 0
    problem_results = []

    for problem in problems:
        max_score += problem.max_score
        ans = answers.get(problem.id)

        if ans is not None:
            # Grade if not yet graded (e.g. answer saved before grading logic ran).
            if ans.score is None and ans.is_correct is None:
                result = grade_answer(problem, ans.answer)
                ans.is_correct = result['is_correct']
                ans.score = result['score']
                ans.save(update_fields=['is_correct', 'score'])
            total_score += ans.score or 0

        problem_results.append({
            'id': problem.id,
            'statement': problem.statement,
            'your_answer': ans.answer if ans else None,
            'is_correct': ans.is_correct if ans else None,
            'score': ans.score if ans else None,
            'max_score': problem.max_score,
            'correct_answer': problem.correct_answer,
            'solution': problem.solution,
        })

    if not attempt.is_completed:
        attempt.score = total_score
        attempt.max_score = max_score
        attempt.is_completed = True
        attempt.finished_at = timezone.now()
        attempt.save(update_fields=['score', 'max_score', 'is_completed', 'finished_at'])

    percent = round(attempt.score / attempt.max_score * 100, 1) if attempt.max_score else 0

    return Response({
        'score': attempt.score,
        'max_score': attempt.max_score,
        'percent': percent,
        'problems': problem_results,
    })


# 7. My attempt history
class MyOlympiadAttemptsView(generics.ListAPIView):
    serializer_class = MockAttemptHistorySerializer

    def get_queryset(self):
        return (
            MockAttempt.objects
            .filter(user=self.request.user)
            .select_related('mock')
            .order_by('-started_at')
        )
