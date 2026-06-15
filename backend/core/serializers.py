from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils import timezone
from datetime import timedelta
from .models import User

# Verification codes are stored on User.email_verification_token as "<code>:<iso-timestamp>".
CODE_TTL_MINUTES = 15


def parse_verification_token(raw):
    """Split a stored token of the form '<code>:<iso>' into (code, created_at|None)."""
    if not raw or ':' not in raw:
        return None, None
    code, _, ts = raw.partition(':')
    created_at = None
    if ts:
        parsed = timezone.datetime.fromisoformat(ts) if ts else None
        if parsed is not None:
            created_at = parsed
    return code, created_at


class SendCodeSerializer(serializers.Serializer):
    email = serializers.EmailField()
    type = serializers.CharField(required=False, allow_blank=True, default='register')

    def validate_email(self, value):
        # For registration we don't allow already-verified accounts to re-register.
        existing = User.objects.filter(email=value, is_email_verified=True).first()
        if existing is not None:
            raise serializers.ValidationError('Пользователь с таким email уже существует.')
        return value


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)
    password_confirm = serializers.CharField(write_only=True)
    code = serializers.CharField(min_length=6, max_length=6)
    full_name = serializers.CharField(required=False, allow_blank=True, default='')
    telegram_username = serializers.CharField(required=False, allow_blank=True, default='')

    def validate_email(self, value):
        if User.objects.filter(email=value, is_email_verified=True).exists():
            raise serializers.ValidationError('Пользователь с таким email уже существует.')
        return value

    def validate_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(list(exc.messages))
        return value

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({'password_confirm': 'Пароли не совпадают.'})

        # Verify the code against the pending (unverified) user created by send-code.
        try:
            user = User.objects.get(email=data['email'])
        except User.DoesNotExist:
            raise serializers.ValidationError({'code': 'Сначала запросите код подтверждения.'})

        stored_code, created_at = parse_verification_token(user.email_verification_token)
        if not stored_code:
            raise serializers.ValidationError({'code': 'Сначала запросите код подтверждения.'})
        if created_at is not None and timezone.now() - created_at > timedelta(minutes=CODE_TTL_MINUTES):
            raise serializers.ValidationError({'code': 'Код истёк. Запросите новый.'})
        if data['code'] != stored_code:
            raise serializers.ValidationError({'code': 'Неверный код подтверждения.'})

        data['pending_user'] = user
        return data

    def create(self, validated_data):
        user = validated_data['pending_user']
        user.full_name = validated_data.get('full_name', '') or user.full_name
        user.telegram_username = validated_data.get('telegram_username', '') or user.telegram_username
        user.set_password(validated_data['password'])
        user.is_email_verified = True
        user.is_active = True
        user.email_verification_token = ''
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(username=data['email'], password=data['password'])
        if user is None:
            raise serializers.ValidationError('Неверный email или пароль.')
        if not user.is_active:
            raise serializers.ValidationError('Аккаунт заблокирован.')
        data['user'] = user
        return data


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'telegram_username', 'is_admin',
                  'is_email_verified', 'created_at', 'updated_at']
        read_only_fields = ['id', 'email', 'is_admin', 'is_email_verified', 'created_at', 'updated_at']


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['full_name', 'telegram_username']


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(min_length=8, write_only=True)

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Неверный текущий пароль.')
        return value

    def validate_new_password(self, value):
        try:
            validate_password(value, user=self.context['request'].user)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(list(exc.messages))
        return value


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ResetPasswordSerializer(serializers.Serializer):
    token = serializers.CharField()
    new_password = serializers.CharField(min_length=8, write_only=True)

    def validate_new_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(list(exc.messages))
        return value


class AdminUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'telegram_username', 'is_admin',
                  'is_email_verified', 'is_active', 'is_staff', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
