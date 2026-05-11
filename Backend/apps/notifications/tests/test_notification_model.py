"""
Unit tests for the Notification model.

Key model facts:
- Notification.is_read defaults to False
- Notification.read_at is null until marked read
- Ordering is newest-first (-created_at)
- notification_type has 30+ choices
- priority defaults to MEDIUM
"""

from django.test import TestCase

from apps.companies.models import Company
from apps.notifications.models import Notification
from django.contrib.auth import get_user_model

User = get_user_model()


class NotificationModelTestCase(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.company = Company.objects.create(name="Notif Test Corp")
        cls.user = User.objects.create_user(
            email="notif_user@corp.sa",
            password="pass",
            role="EMPLOYEE",
            company=cls.company,
            is_verified=True,
        )

    def test_notification_defaults_to_unread(self):
        notif = Notification.objects.create(
            user=self.user,
            notification_type="WELCOME",
            title="Welcome!",
            message="Welcome to PhishAware.",
        )
        notif.refresh_from_db()
        self.assertFalse(notif.is_read)
        self.assertIsNone(notif.read_at)

    def test_notification_priority_defaults_to_medium(self):
        notif = Notification.objects.create(
            user=self.user,
            notification_type="QUIZ_PASSED",
            title="Well done",
            message="You passed the quiz.",
        )
        notif.refresh_from_db()
        self.assertEqual(notif.priority, "MEDIUM")

    def test_notification_str_contains_user_and_title(self):
        notif = Notification.objects.create(
            user=self.user,
            notification_type="TRAINING_ASSIGNED",
            title="New Training",
            message="A new training module has been assigned.",
        )
        result = str(notif)
        self.assertIn(self.user.email, result)
        self.assertIn("New Training", result)

    def test_urgent_priority_notification_persists(self):
        notif = Notification.objects.create(
            user=self.user,
            notification_type="HIGH_RISK_ALERT",
            title="High Risk!",
            message="Your risk score is critical.",
            priority="URGENT",
        )
        notif.refresh_from_db()
        self.assertEqual(notif.priority, "URGENT")

    def test_notification_ordering_newest_first(self):
        n1 = Notification.objects.create(
            user=self.user,
            notification_type="WELCOME",
            title="First",
            message="msg",
        )
        n2 = Notification.objects.create(
            user=self.user,
            notification_type="QUIZ_PASSED",
            title="Second",
            message="msg",
        )
        qs = Notification.objects.filter(user=self.user)
        self.assertEqual(qs.first().pk, n2.pk)
        self.assertEqual(qs.last().pk, n1.pk)
