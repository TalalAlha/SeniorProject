"""
Integration tests for the Analytics API.

Analytics has no DB models — all data is derived via aggregation queries.
All endpoints require IsAuthenticated + IsSuperAdminOrCompanyAdmin.
Employees get 403.

Endpoints under test (mounted at /api/v1/analytics/):
  GET  dashboard/overview/              - company-level overview stats
  GET  dashboard/trends/                - time-series trend data
  GET  risk/distribution/               - risk score distribution
  GET  training/                        - training summary
"""

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.companies.models import Company
from django.contrib.auth import get_user_model

User = get_user_model()


class AnalyticsDashboardAPITest(APITestCase):

    @classmethod
    def setUpTestData(cls):
        cls.company = Company.objects.create(name="Analytics API Corp")
        cls.admin = User.objects.create_user(
            email="analytics_admin@corp.sa",
            password="pass",
            role="COMPANY_ADMIN",
            company=cls.company,
            is_verified=True,
        )
        cls.employee = User.objects.create_user(
            email="analytics_emp@corp.sa",
            password="pass",
            role="EMPLOYEE",
            company=cls.company,
            is_verified=True,
        )

    # ------------------------------------------------------------------
    # Authentication / Authorization
    # ------------------------------------------------------------------

    def test_unauthenticated_cannot_access_dashboard_overview(self):
        resp = self.client.get(reverse("analytics:dashboard-overview"))
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_employee_cannot_access_dashboard_overview(self):
        self.client.force_authenticate(user=self.employee)
        resp = self.client.get(reverse("analytics:dashboard-overview"))
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_company_admin_can_access_dashboard_overview(self):
        self.client.force_authenticate(user=self.admin)
        resp = self.client.get(reverse("analytics:dashboard-overview"))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_company_admin_can_access_dashboard_trends(self):
        self.client.force_authenticate(user=self.admin)
        resp = self.client.get(reverse("analytics:dashboard-trends"))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)


class AnalyticsRiskAPITest(APITestCase):

    @classmethod
    def setUpTestData(cls):
        cls.company = Company.objects.create(name="Analytics Risk Corp")
        cls.admin = User.objects.create_user(
            email="analytics_risk_admin@corp.sa",
            password="pass",
            role="COMPANY_ADMIN",
            company=cls.company,
            is_verified=True,
        )

    def test_risk_distribution_requires_authentication(self):
        resp = self.client.get(reverse("analytics:risk-analytics-distribution"))
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_admin_can_access_risk_distribution(self):
        self.client.force_authenticate(user=self.admin)
        resp = self.client.get(reverse("analytics:risk-analytics-distribution"))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_admin_can_access_training_analytics(self):
        self.client.force_authenticate(user=self.admin)
        resp = self.client.get(reverse("analytics:training-analytics-list"))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
