import uuid
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_admin', True)
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_email_verified', True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True, verbose_name='Email')
    full_name = models.CharField(max_length=255, blank=True, default='', verbose_name='ФИО')
    telegram_username = models.CharField(max_length=100, blank=True, default='', verbose_name='Telegram')
    is_admin = models.BooleanField(default=False, verbose_name='Администратор')
    is_email_verified = models.BooleanField(default=False, verbose_name='Email подтверждён')
    email_verification_token = models.CharField(max_length=255, blank=True, default='', verbose_name='Токен подтверждения email')
    password_reset_token = models.CharField(max_length=255, blank=True, default='', verbose_name='Токен сброса пароля')
    password_reset_token_created = models.DateTimeField(null=True, blank=True, verbose_name='Токен сброса создан')
    is_active = models.BooleanField(default=True, verbose_name='Активен')
    is_staff = models.BooleanField(default=False, verbose_name='Доступ в админку')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создан')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Обновлён')

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        db_table = 'users'
        ordering = ['-created_at']
        verbose_name = 'Пользователь'
        verbose_name_plural = 'Пользователи'

    def __str__(self):
        return self.full_name or self.email

    def generate_verification_token(self):
        self.email_verification_token = uuid.uuid4().hex
        self.save(update_fields=['email_verification_token'])
        return self.email_verification_token

    def generate_password_reset_token(self):
        self.password_reset_token = uuid.uuid4().hex
        self.password_reset_token_created = timezone.now()
        self.save(update_fields=['password_reset_token', 'password_reset_token_created'])
        return self.password_reset_token
