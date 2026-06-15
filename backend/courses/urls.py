from django.urls import path
from . import views

urlpatterns = [
    # Student
    path('me/courses', views.MyCoursesView.as_view(), name='my-courses'),
    path('me/materials', views.my_materials, name='my-materials'),
    path('courses/<int:pk>', views.CourseDetailView.as_view(), name='course-detail'),
    path('lessons/<int:pk>', views.LessonDetailView.as_view(), name='lesson-detail'),
    path('lessons/<int:pk>/watch', views.mark_lesson_watched, name='lesson-watch'),

    # Admin
    path('admin/courses', views.AdminCourseListCreateView.as_view(), name='admin-courses'),
    path('admin/courses/<int:pk>', views.AdminCourseDetailView.as_view(), name='admin-course-detail'),
    path('admin/blocks', views.AdminBlockListCreateView.as_view(), name='admin-blocks'),
    path('admin/blocks/<int:pk>', views.AdminBlockDetailView.as_view(), name='admin-block-detail'),
    path('admin/topics', views.AdminTopicListCreateView.as_view(), name='admin-topics'),
    path('admin/topics/<int:pk>', views.AdminTopicDetailView.as_view(), name='admin-topic-detail'),
    path('admin/lessons', views.AdminLessonListCreateView.as_view(), name='admin-lessons'),
    path('admin/lessons/<int:pk>', views.AdminLessonDetailView.as_view(), name='admin-lesson-detail'),
    path('admin/lesson-materials', views.AdminLessonMaterialListCreateView.as_view(), name='admin-lesson-materials'),
    path('admin/lesson-materials/<int:pk>', views.AdminLessonMaterialDetailView.as_view(), name='admin-lesson-material-detail'),
    path('admin/enrollments', views.AdminEnrollmentListView.as_view(), name='admin-enrollments'),
    path('admin/enrollments/<int:pk>', views.AdminEnrollmentDetailView.as_view(), name='admin-enrollment-detail'),
    path('admin/users/<int:user_id>/enroll', views.admin_enroll_user, name='admin-enroll'),
    path('admin/users/<int:user_id>/enroll/<int:course_id>', views.admin_unenroll_user, name='admin-unenroll'),
]
