from django.urls import path
from . import views

urlpatterns = [
    # Student
    path('lessons/<int:lesson_id>/homework', views.LessonHomeworkView.as_view(), name='lesson-homework'),
    path('problems/bank', views.ProblemBankView.as_view(), name='problem-bank'),
    path('problems/<int:problem_id>/submit', views.submit_answer, name='submit-answer'),
    path('me/submissions/<int:problem_id>', views.my_submissions, name='my-submissions'),
    path('me/mistakes', views.MyMistakesView.as_view(), name='my-mistakes'),
    path('me/homework', views.MyHomeworkOverviewView.as_view(), name='my-homework'),
    path('tags', views.TagListView.as_view(), name='tags'),

    # Admin
    path('admin/homeworks', views.AdminHomeworkListCreateView.as_view(), name='admin-homeworks'),
    path('admin/homeworks/<int:pk>', views.AdminHomeworkDetailView.as_view(), name='admin-homework-detail'),
    path('admin/problems', views.AdminProblemListCreateView.as_view(), name='admin-problems'),
    path('admin/problems/<int:pk>', views.AdminProblemDetailView.as_view(), name='admin-problem-detail'),
    path('admin/problem-options', views.AdminProblemOptionListCreateView.as_view(), name='admin-problem-options'),
    path('admin/problem-options/<int:pk>', views.AdminProblemOptionDetailView.as_view(), name='admin-problem-option-detail'),
    path('admin/problem-attachments', views.AdminProblemAttachmentListCreateView.as_view(), name='admin-problem-attachments'),
    path('admin/problem-attachments/<int:pk>', views.AdminProblemAttachmentDetailView.as_view(), name='admin-problem-attachment-detail'),
    path('admin/tags', views.AdminTagListCreateView.as_view(), name='admin-tags'),
    path('admin/tags/<int:pk>', views.AdminTagDetailView.as_view(), name='admin-tag-detail'),
    path('admin/submissions', views.AdminSubmissionListView.as_view(), name='admin-submissions'),
    path('admin/submissions/<int:pk>/grade', views.admin_grade_submission, name='admin-grade-submission'),
]
