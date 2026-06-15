from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from courses.models import Enrollment
from .models import Homework, Problem, ProblemOption, ProblemAttachment, Submission, Tag
from .serializers import (
    HomeworkSerializer, SubmissionSerializer, SubmitAnswerSerializer,
    GradeSubmissionSerializer, ProblemSerializer, HomeworkOverviewSerializer,
    TagWithCountSerializer,
    AdminHomeworkSerializer, AdminProblemSerializer,
    AdminProblemOptionSerializer, AdminProblemAttachmentSerializer,
    AdminSubmissionSerializer, AdminTagSerializer,
)
from .grading import grade_answer
from core.permissions import IsAdmin


def _enrolled_course_ids(user):
    return Enrollment.objects.filter(user=user).values_list('course_id', flat=True)


def _latest_submission_map(user, problems):
    """Return {problem_id: latest Submission} for the given problems and user."""
    problem_ids = [p.id if hasattr(p, 'id') else p for p in problems]
    result = {}
    subs = Submission.objects.filter(
        user=user, problem_id__in=problem_ids
    ).order_by('problem_id', '-submitted_at')
    for sub in subs:
        if sub.problem_id not in result:
            result[sub.problem_id] = sub
    return result


# Student views
class LessonHomeworkView(generics.RetrieveAPIView):
    """Get homework for a lesson."""
    serializer_class = HomeworkSerializer

    def get_object(self):
        lesson_id = self.kwargs['lesson_id']
        enrolled_course_ids = _enrolled_course_ids(self.request.user)

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
        problem = Problem.objects.select_related(
            'homework__lesson__topic__block__course'
        ).get(pk=problem_id)
    except Problem.DoesNotExist:
        return Response({'detail': 'Задача не найдена.'}, status=404)

    # Check enrollment (bank-only problems with no homework are open to any user).
    if problem.homework_id:
        course = problem.homework.lesson.topic.block.course
        if not Enrollment.objects.filter(user=request.user, course=course).exists():
            return Response({'detail': 'Нет доступа к курсу.'}, status=403)

    serializer = SubmitAnswerSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    answer_data = serializer.validated_data['answer']

    # Grade via the shared grader (text -> manual, others -> auto).
    result = grade_answer(problem, answer_data)

    submission = Submission(
        user=request.user,
        problem=problem,
        answer=answer_data,
        is_auto_checked=result['is_auto_checked'],
        is_correct=result['is_correct'],
        score=result['score'],
    )
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


class ProblemBankView(generics.ListAPIView):
    """
    Problem bank: in_bank problems that belong to the student's enrolled
    courses or are global (homework is null).
    Filters: level, tag (slug), answer_type, q (statement/title), status.
    """
    serializer_class = ProblemSerializer

    def get_queryset(self):
        user = self.request.user
        enrolled_course_ids = _enrolled_course_ids(user)

        qs = Problem.objects.filter(in_bank=True).filter(
            Q(homework__isnull=True) |
            Q(homework__lesson__topic__block__course_id__in=enrolled_course_ids)
        ).distinct().select_related(
            'homework__lesson__topic__block__course'
        ).prefetch_related('options', 'attachments', 'tags')

        params = self.request.query_params

        level = params.get('level')
        if level:
            qs = qs.filter(level=level)

        tag = params.get('tag')
        if tag:
            qs = qs.filter(tags__slug=tag)

        answer_type = params.get('answer_type')
        if answer_type:
            qs = qs.filter(answer_type=answer_type)

        q = params.get('q')
        if q:
            qs = qs.filter(Q(statement__icontains=q) | Q(title__icontains=q))

        status_param = params.get('status')
        if status_param in ('solved', 'unsolved', 'wrong'):
            qs = self._filter_by_status(qs, user, status_param)

        return qs.distinct().order_by('level', 'order', 'id')

    def _filter_by_status(self, qs, user, status_param):
        problem_ids = list(qs.values_list('id', flat=True))
        latest = _latest_submission_map(user, problem_ids)
        keep = []
        for pid in problem_ids:
            sub = latest.get(pid)
            if status_param == 'unsolved':
                if sub is None or sub.is_correct is not True:
                    keep.append(pid)
            elif status_param == 'solved':
                if sub is not None and sub.is_correct is True:
                    keep.append(pid)
            elif status_param == 'wrong':
                if sub is not None and sub.is_correct is False:
                    keep.append(pid)
        return qs.filter(id__in=keep)


class MyMistakesView(generics.ListAPIView):
    """
    Every problem where the student's LATEST submission is_correct=False,
    across enrolled courses + bank. Filters: level, tag.
    Returns problem (solution revealed) + the wrong submission.
    """
    serializer_class = ProblemSerializer

    def get_queryset(self):
        user = self.request.user
        enrolled_course_ids = _enrolled_course_ids(user)

        qs = Problem.objects.filter(
            Q(homework__isnull=True) |
            Q(homework__lesson__topic__block__course_id__in=enrolled_course_ids)
        ).distinct().select_related(
            'homework__lesson__topic__block__course'
        ).prefetch_related('options', 'attachments', 'tags')

        params = self.request.query_params
        level = params.get('level')
        if level:
            qs = qs.filter(level=level)
        tag = params.get('tag')
        if tag:
            qs = qs.filter(tags__slug=tag)

        problem_ids = list(qs.values_list('id', flat=True))
        latest = _latest_submission_map(user, problem_ids)
        wrong_ids = [pid for pid, sub in latest.items() if sub.is_correct is False]
        self._latest = latest
        return qs.filter(id__in=wrong_ids).distinct().order_by('level', 'order', 'id')

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        objects = page if page is not None else queryset

        data = []
        for problem in objects:
            problem_data = ProblemSerializer(problem, context={'request': request}).data
            sub = self._latest.get(problem.id)
            data.append({
                'problem': problem_data,
                'submission': SubmissionSerializer(sub).data if sub else None,
            })

        if page is not None:
            return self.get_paginated_response(data)
        return Response(data)


class MyHomeworkOverviewView(generics.ListAPIView):
    """
    List of all homeworks across enrolled courses with aggregate status,
    for the «Домашние задания» dashboard.
    """
    serializer_class = HomeworkOverviewSerializer
    pagination_class = None

    def get_queryset(self):
        enrolled_course_ids = _enrolled_course_ids(self.request.user)
        return Homework.objects.filter(
            lesson__topic__block__course_id__in=enrolled_course_ids,
            lesson__is_published=True,
        ).select_related(
            'lesson__topic__block__course'
        ).prefetch_related('problems').order_by(
            'lesson__topic__block__order', 'lesson__topic__order', 'lesson__order'
        )

    def list(self, request, *args, **kwargs):
        user = request.user
        homeworks = list(self.get_queryset())

        all_problem_ids = []
        for hw in homeworks:
            all_problem_ids.extend([p.id for p in hw.problems.all()])
        latest = _latest_submission_map(user, all_problem_ids)

        data = []
        for hw in homeworks:
            problems = list(hw.problems.all())
            lesson = hw.lesson
            course = lesson.topic.block.course
            data.append({
                'lesson_id': lesson.id,
                'lesson_title': lesson.title,
                'course_id': course.id,
                'course_title': course.title,
                'homework_id': hw.id,
                'title': hw.title or str(hw),
                'due_date': hw.due_date,
                'problem_count': len(problems),
                'status': self._aggregate_status(problems, latest),
            })
        return Response(data)

    def _aggregate_status(self, problems, latest):
        """
        not_started: no submissions at all.
        in_progress: some answered, some not.
        pending: all answered but at least one awaiting manual check.
        wrong: all answered, none pending, at least one wrong.
        done: all answered correctly.
        """
        if not problems:
            return 'not_started'

        statuses = []
        for p in problems:
            sub = latest.get(p.id)
            if sub is None:
                statuses.append('none')
            elif p.answer_type == 'text' and sub.is_correct is None:
                statuses.append('pending')
            elif sub.is_correct is True:
                statuses.append('correct')
            elif sub.is_correct is False:
                statuses.append('wrong')
            else:
                statuses.append('pending')

        if all(s == 'none' for s in statuses):
            return 'not_started'
        if any(s == 'none' for s in statuses):
            return 'in_progress'
        if any(s == 'pending' for s in statuses):
            return 'pending'
        if any(s == 'wrong' for s in statuses):
            return 'wrong'
        return 'done'


class TagListView(generics.ListAPIView):
    """All tags with problem counts."""
    serializer_class = TagWithCountSerializer
    pagination_class = None

    def get_queryset(self):
        return Tag.objects.annotate(
            problem_count=Count('problems')
        ).order_by('name')


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
    filterset_fields = ['homework', 'answer_type', 'level', 'in_bank', 'tags']
    search_fields = ['statement', 'title', 'source']


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


class AdminTagListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdmin]
    serializer_class = AdminTagSerializer
    queryset = Tag.objects.all()
    search_fields = ['name', 'slug']


class AdminTagDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdmin]
    serializer_class = AdminTagSerializer
    queryset = Tag.objects.all()


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
