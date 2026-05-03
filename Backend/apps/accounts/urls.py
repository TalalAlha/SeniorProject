"""
Accounts URL configuration.
Maps authentication, email verification, password reset, and profile endpoints
under the 'accounts' app namespace. Mounted at /api/v1/auth/ in the root URLconf.
Part of the 'accounts' app.
"""
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    CustomTokenObtainPairView,
    RegisterView,
    LogoutView,
    UserProfileView,
    ChangePasswordView,
    VerifyEmailView,
    ResendVerificationView,
    request_password_reset,
    reset_password,
)

# Namespace used when reversing URLs: reverse('accounts:login')
app_name = 'accounts'

urlpatterns = [
    # --- Authentication ---
    # Public endpoint: creates a new PUBLIC_USER and sends a verification email
    path('register/', RegisterView.as_view(), name='register'),
    # Returns a JWT access + refresh token pair for valid, verified credentials
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),
    # Blacklists the submitted refresh token, effectively ending the session
    path('logout/', LogoutView.as_view(), name='logout'),
    # Exchanges an expired access token for a new one using a valid refresh token
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # --- Email Verification ---
    # Receives the UUID token from the verification link and marks the user verified
    path('verify-email/<uuid:token>/', VerifyEmailView.as_view(), name='verify_email'),
    # Issues a fresh token and resends the verification email (rate-limit externally)
    path('resend-verification/', ResendVerificationView.as_view(), name='resend_verification'),

    # --- Password Reset ---
    # POST with {"email": "..."} — always returns 200 to avoid email enumeration
    path('password-reset/', request_password_reset, name='request_password_reset'),
    # POST with {"password": "..."} and the UUID token from the reset email
    path('password-reset/<uuid:token>/', reset_password, name='reset_password'),

    # --- User Profile ---
    # GET returns the authenticated user's profile; PATCH/PUT updates editable fields
    path('profile/', UserProfileView.as_view(), name='profile'),
    # POST with old + new passwords; requires IsAuthenticated
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
]
