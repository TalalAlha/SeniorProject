"""
Integration tests for the Companies API (CompanyViewSet).

Endpoints under test (mounted at /api/v1/companies/):
  GET    /                           - list companies
  POST   /                           - create company (Super Admin only)
  GET    <id>/                       - retrieve company
  GET    <id>/stats/                 - company statistics
  GET    <id>/users/                 - list users in company
  POST   <id>/activate/              - activate company (Super Admin only)
  POST   <id>/deactivate/            - deactivate company (Super Admin only)
  GET    my_company/                 - current user's company

Permissions:
- list: AllowAny (unauthenticated gets limited view)
- create: IsSuperAdmin
- retrieve: IsAuthenticated
- update: IsCompanyAdmin (own company)
- destroy/activate/deactivate: IsSuperAdmin
"""

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.companies.models import Company
from django.contrib.auth import get_user_model

User = get_user_model()


class CompanyCRUDAPITest(APITestCase):

    @classmethod
    def setUpTestData(cls):
        cls.company = Company.objects.create(
            name="Companies API Corp",
            industry="TECH",
        )
        cls.super_admin = User.objects.create_user(
            email="co_api_sa@phishaware.sa",
            password="pass",
            role="SUPER_ADMIN",
            is_verified=True,
            is_staff=True,
        )
        cls.admin = User.objects.create_user(
            email="co_api_admin@corp.sa",
            password="pass",
            role="COMPANY_ADMIN",
            company=cls.company,
            is_verified=True,
        )
        cls.employee = User.objects.create_user(
            email="co_api_emp@corp.sa",
            password="pass",
            role="EMPLOYEE",
            company=cls.company,
            is_verified=True,
        )

    def _list_url(self):
        return reverse("companies:company-list")

    def _detail_url(self, pk):
        return reverse("companies:company-detail", kwargs={"pk": pk})

    def _stats_url(self, pk):
        return reverse("companies:company-stats", kwargs={"pk": pk})

    def _users_url(self, pk):
        return reverse("companies:company-users", kwargs={"pk": pk})

    # ------------------------------------------------------------------
    # List
    # ------------------------------------------------------------------

    def test_list_companies_returns_200(self):
        resp = self.client.get(self._list_url())
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_authenticated_admin_can_retrieve_own_company(self):
        self.client.force_authenticate(user=self.admin)
        resp = self.client.get(self._detail_url(self.company.pk))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data.get("name"), "Companies API Corp")

    # ------------------------------------------------------------------
    # Create (Super Admin only)
    # ------------------------------------------------------------------

    def test_super_admin_can_create_company(self):
        self.client.force_authenticate(user=self.super_admin)
        resp = self.client.post(
            self._list_url(),
            {"name": "New API Company", "industry": "FINANCE"},
            format="json",
        )
        self.assertIn(resp.status_code, [status.HTTP_201_CREATED, status.HTTP_200_OK])
        self.assertTrue(Company.objects.filter(name="New API Company").exists())

    def test_company_admin_cannot_create_company(self):
        self.client.force_authenticate(user=self.admin)
        resp = self.client.post(
            self._list_url(),
            {"name": "Unauthorized Company"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_cannot_create_company(self):
        resp = self.client.post(
            self._list_url(),
            {"name": "Anon Company"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    # ------------------------------------------------------------------
    # Stats endpoint
    # ------------------------------------------------------------------

    def test_admin_can_access_company_stats(self):
        self.client.force_authenticate(user=self.admin)
        resp = self.client.get(self._stats_url(self.company.pk))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    # ------------------------------------------------------------------
    # Users endpoint
    # ------------------------------------------------------------------

    def test_admin_can_list_company_users(self):
        self.client.force_authenticate(user=self.admin)
        resp = self.client.get(self._users_url(self.company.pk))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        results = resp.data.get("results", resp.data) if isinstance(resp.data, dict) else resp.data
        emails = [u.get("email") for u in results]
        self.assertIn("co_api_admin@corp.sa", emails)
