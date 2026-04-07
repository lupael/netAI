"""Rate limiting is implemented by PathRateLimitMiddleware in app.main.

No shared slowapi limiter is used; see backend/app/main.py for the
sliding-window rate-limit middleware applied to /api/nlp/query and
/api/auth/login.
"""
