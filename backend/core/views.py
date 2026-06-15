import random

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from datetime import timedelta

from .models import User
from .serializers import (
    RegisterSerializer, LoginSerializer, UserSerializer,
    UserProfileUpdateSerializer, ChangePasswordSerializer,
    ForgotPasswordSerializer, ResetPasswordSerializer, AdminUserSerializer,
    SendCodeSerializer,
)
from .permissions import IsAdmin
from .throttles import (
    LoginRateThrottle, RegisterRateThrottle,
    ForgotPasswordRateThrottle, SendCodeRateThrottle,
)


def _issue_tokens(user):
    refresh = RefreshToken.for_user(user)
    return {
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    }


class SendCodeView(generics.GenericAPIView):
    """
    POST /api/auth/send-code  {email, type}
    Generates a 6-digit verification code, stores it on a pending (inactive,
    unverified) User as 'email_verification_token' = '<code>:<iso-timestamp>',
    and emails it. In dev the console email backend prints it.
    """
    permission_classes = [permissions.AllowAny]
    throttle_classes = [SendCodeRateThrottle]
    serializer_class = SendCodeSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']

        code = f'{random.randint(0, 999999):06d}'
        stored = f'{code}:{timezone.now().isoformat()}'

        # Reuse the existing unverified user if present, otherwise create a
        # pending one. Never touch an already-verified account.
        user = User.objects.filter(email=email).first()
        if user is None:
            user = User.objects.create_user(email=email, password=None)
            user.is_active = False
        elif user.is_email_verified:
            # validate_email already guards this, but stay safe.
            return Response(
                {'detail': 'Пользователь с таким email уже существует.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.email_verification_token = stored
        user.save(update_fields=['email_verification_token', 'is_active'])

        try:
            send_mail(
                'Код подтверждения — Апекс',
                f'Ваш код подтверждения: {code}\n\nКод действителен 15 минут.',
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=True,
            )
        except Exception:
            pass

        return Response({'detail': 'Код подтверждения отправлен на email.'})


class RegisterView(generics.CreateAPIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [RegisterRateThrottle]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        return Response({
            'user': UserSerializer(user).data,
            'tokens': _issue_tokens(user),
        }, status=status.HTTP_201_CREATED)


class LoginView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [LoginRateThrottle]
    serializer_class = LoginSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']

        return Response({
            'user': UserSerializer(user).data,
            'tokens': _issue_tokens(user),
        })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    """Blacklist the supplied refresh token. A bad/expired token still returns 200."""
    try:
        refresh_token = request.data.get('refresh')
        if refresh_token:
            RefreshToken(refresh_token).blacklist()
    except Exception:
        pass
    return Response({'detail': 'Выход выполнен.'})


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def verify_email_view(request):
    token = request.query_params.get('token')
    if not token:
        return Response({'detail': 'Токен не указан.'}, status=400)

    try:
        user = User.objects.get(email_verification_token=token)
        user.is_email_verified = True
        user.is_active = True
        user.email_verification_token = ''
        user.save(update_fields=['is_email_verified', 'is_active', 'email_verification_token'])
        return Response({'detail': 'Email подтверждён.'})
    except User.DoesNotExist:
        return Response({'detail': 'Недействительный токен.'}, status=400)


class ForgotPasswordView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ForgotPasswordRateThrottle]
    serializer_class = ForgotPasswordSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']

        try:
            user = User.objects.get(email=email, is_email_verified=True)
            token = user.generate_password_reset_token()
            reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"

            send_mail(
                'Сброс пароля — Апекс',
                f'Для сброса пароля перейдите по ссылке: {reset_url}\n\nСсылка действительна 1 час.',
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=True,
            )
        except User.DoesNotExist:
            pass  # Don't reveal whether the email exists.

        return Response({'detail': 'Если email зарегистрирован, на него отправлена ссылка для сброса пароля.'})


class ResetPasswordView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ForgotPasswordRateThrottle]
    serializer_class = ResetPasswordSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        token = serializer.validated_data['token']
        new_password = serializer.validated_data['new_password']

        try:
            user = User.objects.get(password_reset_token=token)
        except User.DoesNotExist:
            return Response({'detail': 'Недействительный токен.'}, status=400)

        # Enforce 1-hour token expiry. Missing timestamp is treated as expired.
        if not user.password_reset_token_created or \
           timezone.now() - user.password_reset_token_created > timedelta(hours=1):
            return Response({'detail': 'Токен истёк.'}, status=400)

        user.set_password(new_password)
        user.password_reset_token = ''
        user.password_reset_token_created = None
        user.save()
        return Response({'detail': 'Пароль успешно изменён.'})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def me_view(request):
    return Response(UserSerializer(request.user).data)


class ProfileUpdateView(generics.UpdateAPIView):
    serializer_class = UserProfileUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class ChangePasswordView(generics.GenericAPIView):
    serializer_class = ChangePasswordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        return Response({'detail': 'Пароль изменён.'})


# Admin views
class AdminUserListView(generics.ListAPIView):
    permission_classes = [IsAdmin]
    serializer_class = AdminUserSerializer
    queryset = User.objects.all()
    filterset_fields = ['is_admin', 'is_active', 'is_email_verified']
    search_fields = ['email', 'full_name', 'telegram_username']


class AdminUserDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAdmin]
    serializer_class = AdminUserSerializer
    queryset = User.objects.all()
