from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from courses.models import Enrollment
from .models import Homework, Problem, ProblemOption, ProblemAttachment, Submission
from .serializers import (
    HomeworkSerializer, SubmissionSerializer, SubmitAnswerSerializer,
    GradeSubmissionSerializer, AdminHomeworkSerializer, AdminProblemSerializer,
    AdminProblemOptionSerializer, AdminProblemAttachmentSerializer,
    AdminSubmissionSerializer,
)
from .formula_checker import check_formula_equivalence, check_number_answer, check_choice_answer
from core.permissions import IsAdmin


# Student views
class LessonHomeworkView(generics.RetrieveAPIView):
    """Get homework for a lesson."""
    serializer_class = HomeworkSerializer

    def get_object(self):
        lesson_id = self.kwargs['lesson_id']
        enrolled_course_ids = Enrollment.objects.filter(
            user=self.request.user
        ).values_list('course_id', flat=True)

        return Homework.objects.get(
            lesson_id=lesson_id,
            lesson__topic__block__course_id__in=enrolled_course_ids,
            lesson__is_published=True
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def submit_answer(request, problem_id):
    """Submit an answer to a problem."""
    try:
        problem = Problem.objects.select_related('homework__lesson__topic__block__course').get(pk=problem_id)
    except Problem.DoesNotExist:
        return Response({'detail': 'Задача не найдена.'}, status=404)

    # Check enrollment
    course = problem.homework.lesson.topic.block.course
    if not Enrollment.objects.filter(user=request.user, course=course).exists():
        return Response({'detail': 'Нет доступа к курсу.'}, status=403)

    serializer = SubmitAnswerSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    answer_data = serializer.validated_data['answer']

    # Create submission
    submission = Submission(
        user=request.user,
        problem=problem,
        answer=answer_data,
    )

    # Auto-check based on answer type
    if problem.answer_type == 'text':
        submission.is_auto_checked = False
        submission.is_correct = None
        submission.score = None

    elif problem.answer_type == 'choice_single':
        submission.is_auto_checked = True
        correct = problem.correct_answer
        if correct and 'correct_option_id' in correct:
            student_option = str(answer_data.get('option_id', ''))
            submission.is_correct = student_option == str(correct['correct_option_id'])
        else:
            # Fallback: check from ProblemOption
            correct_ids = list(
                ProblemOption.objects.filter(problem=problem, is_correct=True)
                .values_list('id', flat=True)
            )
            student_option = answer_data.get('option_id')
            submission.is_correct = int(student_option) in correct_ids if student_option else False
        submission.score = problem.max_score if submission.is_correct else 0

    elif problem.answer_type == 'choice_multiple':
        submission.is_auto_checked = True
        correct = problem.correct_answer
        if correct and 'correct_option_ids' in correct:
            correct_ids = set(str(x) for x in correct['correct_option_ids'])
            student_ids = set(str(x) for x in answer_data.get('option_ids', []))
            submission.is_correct = correct_ids == student_ids
        else:
            correct_ids = set(
                str(x) for x in ProblemOption.objects.filter(problem=problem, is_correct=True)
                .values_list('id', flat=True)
            )
            student_ids = set(str(x) for x in answer_data.get('option_ids', []))
            submission.is_correct = correct_ids == student_ids
        submission.score = problem.max_score if submission.is_correct else 0

    elif problem.answer_type == 'number':
        submission.is_auto_checked = True
        correct = problem.correct_answer or {}
        submission.is_correct = check_number_answer(
            answer_data.get('value'),
            correct.get('value', 0),
            correct.get('tolerance_type', 'abs'),
            correct.get('tolerance', 0)
        )
        submission.score = problem.max_score if submission.is_correct else 0

    elif problem.answer_type == 'formula':
        submission.is_auto_checked = True
        correct = problem.correct_answer or {}
        student_latex = answer_data.get('latex', '')
        correct_latex = correct.get('latex', '')

        is_correct, method = check_formula_equivalence(student_latex, correct_latex)
        submission.is_correct = is_correct
        submission.score = problem.max_score if is_correct else 0

    if submission.is_auto_checked:
        submission.checked_at = timezone.now()

    submission.save()
    return Response(SubmissionSerializer(submission).data, status=201)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def my_submissions(request, problem_id):
    """Get submission history for a problem."""
    submissions = Submission.objects.filter(
        user=request.user, problem_id=problem_id
    ).order_by('-submitted_at')
    return Response(SubmissionSerializer(submissions, many=True).data)


# Admin views
class AdminHomeworkListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdmin]
    serializer_class = AdminHomeworkSerializer
    queryset = Homework.objects.all()
    filterset_fields = ['lesson']


class AdminHomeworkDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdmin]
    serializer_class = AdminHomeworkSerializer
    queryset = Homework.objects.all()


class AdminProblemListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdmin]
    serializer_class = AdminProblemSerializer
    queryset = Problem.objects.all()
    filterset_fields = ['homework', 'answer_type']


class AdminProblemDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdmin]
    serializer_class = AdminProblemSerializer
    queryset = Problem.objects.all()


class AdminProblemOptionListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdmin]
    serializer_class = AdminProblemOptionSerializer
    queryset = ProblemOption.objects.all()
    filterset_fields = ['problem']


class AdminProblemOptionDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdmin]
    serializer_class = AdminProblemOptionSerializer
    queryset = ProblemOption.objects.all()


class AdminProblemAttachmentListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdmin]
    serializer_class = AdminProblemAttachmentSerializer
    queryset = ProblemAttachment.objects.all()
    filterset_fields = ['problem']


class AdminProblemAttachmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdmin]
    serializer_class = AdminProblemAttachmentSerializer
    queryset = ProblemAttachment.objects.all()


class AdminSubmissionListView(generics.ListAPIView):
    permission_classes = [IsAdmin]
    serializer_class = AdminSubmissionSerializer
    queryset = Submission.objects.all()
    filterset_fields = ['is_auto_checked', 'is_correct', 'user', 'problem']

    def get_queryset(self):
        qs = super().get_queryset()
        status_param = self.request.query_params.get('status')
        if status_param == 'pending':
            qs = qs.filter(is_auto_checked=False, score__isnull=True)
        return qs


@api_view(['POST'])
@permission_classes([IsAdmin])
def admin_grade_submission(request, pk):
    """Grade a submission (for text answers)."""
    try:
        submission = Submission.objects.get(pk=pk)
    except Submission.DoesNotExist:
        return Response({'detail': 'Сдача не найдена.'}, status=404)

    serializer = GradeSubmissionSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    score = serializer.validated_data['score']
    if score > submission.problem.max_score:
        return Response({'detail': f'Максимальный балл: {submission.problem.max_score}'}, status=400)

    submission.score = score
    submission.admin_comment = serializer.validated_data.get('admin_comment', '')
    submission.checked_at = timezone.now()

    is_correct = serializer.validated_data.get('is_correct')
    if is_correct is not None:
        submission.is_correct = is_correct
    else:
        submission.is_correct = score == submission.problem.max_score

    submission.save()
    return Response(AdminSubmissionSerializer(submission).data)
