"""
Rate limiting for authentication endpoints.
Limits: 5 attempts per 15 minutes per IP.
"""
from rest_framework.throttling import AnonRateThrottle


class LoginRateThrottle(AnonRateThrottle):
    """Rate limit for login attempts: 5/15min per IP."""
    rate = '5/15min'
    scope = 'login'

    def parse_rate(self, rate):
        """Parse custom rate format like '5/15min'."""
        if rate is None:
            return (None, None)
        num, period = rate.split('/')
        num_requests = int(num)
        # Parse period
        if period.endswith('min'):
            duration = int(period[:-3]) * 60
        elif period.endswith('h'):
            duration = int(period[:-1]) * 3600
        else:
            durations = {'s': 1, 'sec': 1, 'min': 60, 'hour': 3600, 'day': 86400}
            duration = durations.get(period, 60)
        return (num_requests, duration)


class RegisterRateThrottle(AnonRateThrottle):
    """Rate limit for registration: 5/15min per IP."""
    rate = '5/15min'
    scope = 'register'

    def parse_rate(self, rate):
        if rate is None:
            return (None, None)
        num, period = rate.split('/')
        num_requests = int(num)
        if period.endswith('min'):
            duration = int(period[:-3]) * 60
        elif period.endswith('h'):
            duration = int(period[:-1]) * 3600
        else:
            durations = {'s': 1, 'sec': 1, 'min': 60, 'hour': 3600, 'day': 86400}
            duration = durations.get(period, 60)
        return (num_requests, duration)


class ForgotPasswordRateThrottle(AnonRateThrottle):
    """Rate limit for forgot password: 3/15min per IP."""
    rate = '3/15min'
    scope = 'forgot_password'

    def parse_rate(self, rate):
        if rate is None:
            return (None, None)
        num, period = rate.split('/')
        num_requests = int(num)
        if period.endswith('min'):
            duration = int(period[:-3]) * 60
        elif period.endswith('h'):
            duration = int(period[:-1]) * 3600
        else:
            durations = {'s': 1, 'sec': 1, 'min': 60, 'hour': 3600, 'day': 86400}
            duration = durations.get(period, 60)
        return (num_requests, duration)
