"""
Rate limiting for authentication endpoints.
Limits: login/register 5/15min, send-code/forgot-password 3/15min per IP.
"""
from rest_framework.throttling import AnonRateThrottle


def _parse_rate(rate):
    """Parse custom rate format like '5/15min', '3/h', '10/day'."""
    if rate is None:
        return (None, None)
    num, period = rate.split('/')
    num_requests = int(num)
    if period.endswith('min'):
        duration = int(period[:-3] or 1) * 60
    elif period.endswith('h'):
        duration = int(period[:-1] or 1) * 3600
    else:
        durations = {'s': 1, 'sec': 1, 'min': 60, 'hour': 3600, 'day': 86400}
        duration = durations.get(period, 60)
    return (num_requests, duration)


class LoginRateThrottle(AnonRateThrottle):
    """Rate limit for login attempts: 5/15min per IP."""
    rate = '5/15min'
    scope = 'login'

    def parse_rate(self, rate):
        return _parse_rate(rate)


class RegisterRateThrottle(AnonRateThrottle):
    """Rate limit for registration: 5/15min per IP."""
    rate = '5/15min'
    scope = 'register'

    def parse_rate(self, rate):
        return _parse_rate(rate)


class SendCodeRateThrottle(AnonRateThrottle):
    """Rate limit for sending verification codes: 3/15min per IP."""
    rate = '3/15min'
    scope = 'send_code'

    def parse_rate(self, rate):
        return _parse_rate(rate)


class ForgotPasswordRateThrottle(AnonRateThrottle):
    """Rate limit for forgot password: 3/15min per IP."""
    rate = '3/15min'
    scope = 'forgot_password'

    def parse_rate(self, rate):
        return _parse_rate(rate)
