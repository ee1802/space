from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User
from courses.models import Enrollment


class EnrollmentInline(admin.TabularInline):
    model = Enrollment
    extra = 1
    fields = ['course', 'granted_at', 'manual_progress_override']
    readonly_fields = ['granted_at']
    autocomplete_fields = ['course']
    verbose_name = 'Доступ к курсу'
    verbose_name_plural = 'Доступы к курсам'


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'full_name', 'telegram_link', 'is_admin', 'is_email_verified', 'is_active', 'created_at']
    list_filter = ['is_admin', 'is_email_verified', 'is_active', 'is_staff', 'created_at']
    search_fields = ['email', 'full_name', 'telegram_username']
    ordering = ['-created_at']
    date_hierarchy = 'created_at'
    inlines = [EnrollmentInline]
    actions = ['verify_email', 'make_admin', 'remove_admin']

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

    @admin.display(description='Telegram')
    def telegram_link(self, obj):
        return obj.telegram_username or '—'

    @admin.action(description='Подтвердить email')
    def verify_email(self, request, queryset):
        updated = queryset.update(is_email_verified=True)
        self.message_user(request, f'Email подтверждён у {updated} пользователей.')

    @admin.action(description='Сделать администратором')
    def make_admin(self, request, queryset):
        updated = queryset.update(is_admin=True, is_staff=True)
        self.message_user(request, f'Назначено администраторами: {updated}.')

    @admin.action(description='Снять права администратора')
    def remove_admin(self, request, queryset):
        updated = queryset.update(is_admin=False)
        self.message_user(request, f'Сняты права администратора у {updated} пользователей.')
