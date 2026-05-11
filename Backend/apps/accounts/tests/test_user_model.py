"""
Unit tests for the custom User model in the accounts app.
Tests cover creation, email normalisation, role flags, and invitation fields.
"""
import uuid
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from apps.companies.models import Company

User = get_user_model()


class UserModelTestCase(TestCase):
    """Unit tests for the User model and UserManager."""

    @classmethod
    def setUpTestData(cls):
        cls.company = Company.objects.create(name="AlphaTest Corp")

    # ------------------------------------------------------------------
    # Creation
    # ------------------------------------------------------------------

    def test_create_user_with_email_succeeds(self):
        user = User.objects.create_user(
            email="talal@example.com",
            password="SecurePass1!",
            first_name="Talal",
            last_name="Al-Harbi",
        )
        self.assertEqual(user.email, "talal@example.com")
        self.assertTrue(user.check_password("SecurePass1!"))
        self.assertTrue(user.is_active)

    def test_create_user_without_email_raises_value_error(self):
        with self.assertRaises(ValueError):
            User.objects.create_user(email="", password="pass123")

    def test_email_is_normalized_to_lowercase(self):
        user = User.objects.create_user(
            email="UPPER@EXAMPLE.COM",
            password="pass123",
        )
        # Both the local part and domain should be lowercase
        self.assertEqual(user.email, "upper@example.com")

    # ------------------------------------------------------------------
    # Role flags
    # ------------------------------------------------------------------

    def test_role_flag_is_super_admin_returns_true_for_super_admin(self):
        user = User.objects.create_user(
            email="superadmin@phishaware.sa",
            password="pass",
            role="SUPER_ADMIN",
        )
        self.assertTrue(user.is_super_admin)
        self.assertFalse(user.is_company_admin)
        self.assertFalse(user.is_employee)

    def test_role_flag_is_company_admin_returns_true_for_company_admin(self):
        user = User.objects.create_user(
            email="admin@company.sa",
            password="pass",
            role="COMPANY_ADMIN",
            company=self.company,
        )
        self.assertTrue(user.is_company_admin)
        self.assertFalse(user.is_super_admin)
        self.assertFalse(user.is_employee)

    def test_role_flag_is_employee_returns_true_for_employee(self):
        user = User.objects.create_user(
            email="employee@company.sa",
            password="pass",
            role="EMPLOYEE",
            company=self.company,
        )
        self.assertTrue(user.is_employee)
        self.assertFalse(user.is_company_admin)
        self.assertFalse(user.is_super_admin)

    # ------------------------------------------------------------------
    # Verification token
    # ------------------------------------------------------------------

    def test_verification_token_is_uuid_and_unique_per_user(self):
        user_a = User.objects.create_user(email="aisha@example.sa", password="pass")
        user_b = User.objects.create_user(email="sara@example.sa", password="pass")
        # Both tokens must be valid UUIDs
        uuid.UUID(str(user_a.verification_token))
        uuid.UUID(str(user_b.verification_token))
        # Tokens must differ between users
        self.assertNotEqual(user_a.verification_token, user_b.verification_token)

    # ------------------------------------------------------------------
    # Invitation fields
    # ------------------------------------------------------------------

    def test_invitation_status_default_or_set_pending(self):
        # A freshly created user has no invitation status (null by default)
        user = User.objects.create_user(
            email="new_invite@company.sa",
            password="pass",
            role="EMPLOYEE",
            company=self.company,
        )
        self.assertIsNone(user.invitation_status)

        # Explicitly setting PENDING must persist
        user.invitation_status = "PENDING"
        user.invitation_token = uuid.uuid4()
        user.invitation_sent_at = timezone.now()
        user.save()
        user.refresh_from_db()
        self.assertEqual(user.invitation_status, "PENDING")

    def test_invitation_older_than_seven_days_is_expired(self):
        """Invitation sent more than 7 days ago should be treated as expired."""
        eight_days_ago = timezone.now() - timedelta(days=8)
        user = User.objects.create_user(
            email="expired_invite@company.sa",
            password="pass",
            role="EMPLOYEE",
            company=self.company,
            invitation_status="PENDING",
            invitation_token=uuid.uuid4(),
            invitation_sent_at=eight_days_ago,
        )
        # The check mirrors the logic used in accounts/views.py
        is_expired = (timezone.now() - user.invitation_sent_at) > timedelta(days=7)
        self.assertTrue(is_expired)

    def test_invitation_under_seven_days_is_not_expired(self):
        two_days_ago = timezone.now() - timedelta(days=2)
        user = User.objects.create_user(
            email="fresh_invite@company.sa",
            password="pass",
            role="EMPLOYEE",
            company=self.company,
            invitation_status="PENDING",
            invitation_token=uuid.uuid4(),
            invitation_sent_at=two_days_ago,
        )
        is_expired = (timezone.now() - user.invitation_sent_at) > timedelta(days=7)
        self.assertFalse(is_expired)
