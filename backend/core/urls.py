from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # Auth
    path('auth/register', views.RegisterView.as_view(), name='register'),
    path('auth/login', views.LoginView.as_view(), name='login'),
    path('auth/logout', views.logout_view, name='logout'),
    path('auth/verify-email', views.verify_email_view, name='verify-email'),
    path('auth/forgot-password', views.ForgotPasswordView.as_view(), name='forgot-password'),
    path('auth/reset-password', views.ResetPasswordView.as_view(), name='reset-password'),
    path('auth/me', views.me_view, name='me'),
    path('auth/token/refresh', TokenRefreshView.as_view(), name='token-refresh'),

    # Profile
    path('me/profile', views.ProfileUpdateView.as_view(), name='profile-update'),
    path('me/change-password', views.ChangePasswordView.as_view(), name='change-password'),

    # Admin users
    path('admin/users', views.AdminUserListView.as_view(), name='admin-users'),
    path('admin/users/<int:pk>', views.AdminUserDetailView.as_view(), name='admin-user-detail'),
]
