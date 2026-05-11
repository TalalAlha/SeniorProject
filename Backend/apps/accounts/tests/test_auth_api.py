"""
Integration tests for the accounts authentication API.
Tests the full HTTP layer using DRF's APITestCase and the real URL dispatcher.

Endpoints under test (mounted at /api/v1/auth/):
  POST   register/
  POST   login/
  POST   token/refresh/
  GET    verify-email/<uuid>/
  POST   resend-verification/
  POST   password-reset/
  GET    profile/
"""
import uuid

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from apps.companies.models import Company

User = get_user_model()


class RegisterAPITest(APITestCase):

    def test_register_creates_unverified_user(self):
        url = reverse("accounts:register")
        payload = {
            "email": "newuser@phishaware.sa",
            "password": "PhishAware123!",
            "first_name": "Ahmad",
            "last_name": "Al-Ghamdi",
        }
        resp = self.client.post(url, payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

        user = User.objects.get(email="newuser@phishaware.sa")
        self.assertFalse(user.is_verified)

    def test_register_with_duplicate_email_returns_400(self):
        User.objects.create_user(email="dup@phishaware.sa", password="pass")
        url = reverse("accounts:register")
        resp = self.client.post(url, {"email": "dup@phishaware.sa", "password": "pass2"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)


class LoginAPITest(APITestCase):

    @classmethod
    def setUpTestData(cls):
        cls.company = Company.objects.create(name="Login Test Corp")
        # Verified user
        cls.verified_user = User.objects.create_user(
            email="verified@corp.sa",
            password="Verified123!",
            is_verified=True,
            is_active=True,
        )
        # Unverified user
        cls.unverified_user = User.objects.create_user(
            email="unverified@corp.sa",
            password="Unverified123!",
            is_verified=False,
            is_active=True,
        )

    def _login_url(self):
        return reverse("accounts:login")

    def test_login_with_verified_email_returns_jwt_pair(self):
        resp = self.client.post(
            self._login_url(),
            {"email": "verified@corp.sa", "password": "Verified123!"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("access", resp.data)
        self.assertIn("refresh", resp.data)

    def test_login_with_unverified_email_returns_400(self):
        resp = self.client.post(
            self._login_url(),
            {"email": "unverified@corp.sa", "password": "Unverified123!"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        # The response body includes the email_not_verified flag
        self.assertTrue(resp.data.get("email_not_verified", False))

    def test_login_with_wrong_password_returns_401(self):
        resp = self.client.post(
            self._login_url(),
            {"email": "verified@corp.sa", "password": "WrongPassword!"},
            format="json",
        )
        self.assertIn(resp.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_401_UNAUTHORIZED])

    def test_login_staff_user_bypasses_verification(self):
        """is_staff=True should bypass email verification check."""
        staff = User.objects.create_user(
            email="staff@corp.sa",
            password="Staff123!",
            is_verified=False,
            is_staff=True,
            is_active=True,
        )
        resp = self.client.post(
            self._login_url(),
            {"email": "staff@corp.sa", "password": "Staff123!"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)


class TokenRefreshAPITest(APITestCase):

    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(
            email="refresh@corp.sa",
            password="Refresh123!",
            is_verified=True,
            is_active=True,
        )

    def test_token_refresh_returns_new_access_token(self):
        refresh = RefreshToken.for_user(self.user)
        url = reverse("accounts:token_refresh")
        resp = self.client.post(url, {"refresh": str(refresh)}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("access", resp.data)


class ProfileAPITest(APITestCase):

    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(
            email="profile@corp.sa",
            password="Profile123!",
            is_verified=True,
            is_active=True,
            first_name="Faisal",
            last_name="Al-Rashid",
        )

    def test_profile_endpoint_requires_auth_returns_401_when_anonymous(self):
        url = reverse("accounts:profile")
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_profile_endpoint_returns_user_data_when_authenticated(self):
        self.client.force_authenticate(user=self.user)
        url = reverse("accounts:profile")
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["email"], "profile@corp.sa")


class EmailVerificationAPITest(APITestCase):

    def test_email_verification_token_flips_is_verified_to_true(self):
        user = User.objects.create_user(
            email="verifyme@corp.sa",
            password="pass",
            is_verified=False,
        )
        token = user.verification_token
        url = reverse("accounts:verify_email", kwargs={"token": str(token)})
        # VerifyEmailView uses POST (see accounts/views.py VerifyEmailView.post)
        resp = self.client.post(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertTrue(user.is_verified)


class PasswordResetAPITest(APITestCase):

    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(
            email="resetme@corp.sa",
            password="OldPass123!",
            is_verified=True,
            is_active=True,
        )

    def test_password_reset_request_always_returns_200(self):
        """Endpoint always returns 200 to avoid email enumeration."""
        url = reverse("accounts:request_password_reset")
        resp = self.client.post(url, {"email": "resetme@corp.sa"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_password_reset_request_for_unknown_email_still_returns_200(self):
        url = reverse("accounts:request_password_reset")
        resp = self.client.post(url, {"email": "nobody@corp.sa"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
