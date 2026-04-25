from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User
from courses.models import Enrollment


class EnrollmentInline(admin.TabularInline):
    model = Enrollment
    extra = 1
    fields = ['course', 'granted_at', 'manual_progress_override']
    readonly_fields = ['granted_at']


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'full_name', 'is_admin', 'is_email_verified', 'is_active', 'created_at']
    list_filter = ['is_admin', 'is_email_verified', 'is_active']
    search_fields = ['email', 'full_name', 'telegram_username']
    ordering = ['-created_at']
    inlines = [EnrollmentInline]

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Личные данные', {'fields': ('full_name', 'telegram_username')}),
        ('Права', {'fields': ('is_admin', 'is_staff', 'is_superuser', 'is_active', 'is_email_verified')}),
        ('Даты', {'fields': ('created_at', 'updated_at', 'last_login')}),
    )
    readonly_fields = ['created_at', 'updated_at', 'last_login']

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'full_name', 'is_admin', 'is_staff'),
        }),
    )
