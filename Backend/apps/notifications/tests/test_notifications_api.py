"""
Integration tests for the Notifications API (NotificationViewSet).

Endpoints under test (mounted at /api/v1/notifications/):
  GET    /                           - list own notifications
  GET    <id>/                       - retrieve single notification
  GET    unread_count/               - count of unread notifications
  POST   <id>/mark_read/             - mark one notification as read
  POST   mark_all_read/              - mark all as read
  DELETE clear_all/                  - delete all notifications

Permissions: IsAuthenticated; queryset is always scoped to request.user.
"""

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.companies.models import Company
from apps.notifications.models import Notification
from django.contrib.auth import get_user_model

User = get_user_model()


class NotificationListAPITest(APITestCase):

    @classmethod
    def setUpTestData(cls):
        cls.company = Company.objects.create(name="Notif API Corp")
        cls.user = User.objects.create_user(
            email="notif_api@corp.sa",
            password="pass",
            role="EMPLOYEE",
            company=cls.company,
            is_verified=True,
        )
        cls.other_user = User.objects.create_user(
            email="notif_other@corp.sa",
            password="pass",
            role="EMPLOYEE",
            company=cls.company,
            is_verified=True,
        )

    def _make_notification(self, user=None, title="Test Notif", ntype="WELCOME"):
        return Notification.objects.create(
            user=user or self.user,
            notification_type=ntype,
            title=title,
            message="Test message.",
        )

    # ------------------------------------------------------------------
    # Authentication
    # ------------------------------------------------------------------

    def test_unauthenticated_cannot_list_notifications(self):
        resp = self.client.get(reverse("notification-list"))
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    # ------------------------------------------------------------------
    # List scoping
    # ------------------------------------------------------------------

    def test_employee_can_list_own_notifications(self):
        self._make_notification()
        self.client.force_authenticate(user=self.user)
        resp = self.client.get(reverse("notification-list"))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        results = resp.data.get("results", resp.data) if isinstance(resp.data, dict) else resp.data
        self.assertGreaterEqual(len(results), 1)

    def test_employee_cannot_see_other_users_notifications(self):
        self._make_notification(user=self.other_user, title="Other User Notif")
        self.client.force_authenticate(user=self.user)
        resp = self.client.get(reverse("notification-list"))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        results = resp.data.get("results", resp.data) if isinstance(resp.data, dict) else resp.data
        titles = [n["title"] for n in results]
        self.assertNotIn("Other User Notif", titles)

    # ------------------------------------------------------------------
    # Unread count
    # ------------------------------------------------------------------

    def test_unread_count_returns_correct_number(self):
        Notification.objects.filter(user=self.user).delete()
        self._make_notification(title="Unread 1")
        self._make_notification(title="Unread 2")
        self.client.force_authenticate(user=self.user)
        resp = self.client.get(reverse("notification-unread-count"))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data.get("count"), 2)

    # ------------------------------------------------------------------
    # Mark read actions
    # ------------------------------------------------------------------

    def test_mark_read_sets_is_read_to_true(self):
        notif = self._make_notification(title="Unread Mark Test")
        self.assertFalse(notif.is_read)
        self.client.force_authenticate(user=self.user)
        resp = self.client.post(
            reverse("notification-mark-read", kwargs={"pk": notif.pk})
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        notif.refresh_from_db()
        self.assertTrue(notif.is_read)

    def test_mark_all_read_marks_all_unread_notifications(self):
        Notification.objects.filter(user=self.user).delete()
        self._make_notification(title="Unread A")
        self._make_notification(title="Unread B")
        self.client.force_authenticate(user=self.user)
        resp = self.client.post(reverse("notification-mark-all-read"))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        unread = Notification.objects.filter(user=self.user, is_read=False).count()
        self.assertEqual(unread, 0)
