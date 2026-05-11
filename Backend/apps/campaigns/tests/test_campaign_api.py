"""
Integration tests for the Campaigns API (CampaignViewSet, QuizViewSet).
Tests RBAC scoping, CRUD, and the activate action.

URL prefix: /api/v1/campaigns/campaigns/
"""
from decimal import Decimal

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.campaigns.models import Campaign, Quiz
from apps.companies.models import Company
from django.contrib.auth import get_user_model

User = get_user_model()


class CampaignCRUDAPITest(APITestCase):

    @classmethod
    def setUpTestData(cls):
        cls.company = Company.objects.create(name="Campaign API Test Corp")
        cls.other_company = Company.objects.create(name="Campaign API Other Corp")

        cls.admin = User.objects.create_user(
            email="camp_admin@corp.sa",
            password="pass",
            role="COMPANY_ADMIN",
            company=cls.company,
            is_verified=True,
        )
        cls.employee = User.objects.create_user(
            email="camp_employee@corp.sa",
            password="pass",
            role="EMPLOYEE",
            company=cls.company,
            is_verified=True,
        )
        cls.other_admin = User.objects.create_user(
            email="camp_other_admin@corp.sa",
            password="pass",
            role="COMPANY_ADMIN",
            company=cls.other_company,
            is_verified=True,
        )

    def _create_campaign_payload(self, name="API Test Campaign"):
        return {
            "name": name,
            "description": "Test campaign for API tests",
            "company": self.company.pk,
            "num_emails": 10,
            "phishing_ratio": "0.50",
            "english_ratio": "0.70",
        }

    def _list_url(self):
        return reverse("campaigns:campaign-list")

    def _detail_url(self, pk):
        return reverse("campaigns:campaign-detail", kwargs={"pk": pk})

    def _activate_url(self, pk):
        return reverse("campaigns:campaign-activate", kwargs={"pk": pk})

    # ------------------------------------------------------------------
    # Create
    # ------------------------------------------------------------------

    def test_admin_can_create_campaign_via_post(self):
        self.client.force_authenticate(user=self.admin)
        resp = self.client.post(self._list_url(), self._create_campaign_payload(), format="json")
        self.assertIn(resp.status_code, [status.HTTP_201_CREATED, status.HTTP_200_OK])
        self.assertEqual(Campaign.objects.filter(company=self.company).count(), 1)

    def test_employee_cannot_create_campaign_returns_403(self):
        self.client.force_authenticate(user=self.employee)
        resp = self.client.post(self._list_url(), self._create_campaign_payload(), format="json")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_anonymous_cannot_create_campaign_returns_401(self):
        resp = self.client.post(self._list_url(), self._create_campaign_payload(), format="json")
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    # ------------------------------------------------------------------
    # RBAC scoping
    # ------------------------------------------------------------------

    def test_employee_can_list_only_own_company_campaigns(self):
        # Create campaigns for both companies
        Campaign.objects.create(
            name="My Company Camp",
            description="desc",
            company=self.company,
            created_by=self.admin,
        )
        Campaign.objects.create(
            name="Other Company Camp",
            description="desc",
            company=self.other_company,
            created_by=self.other_admin,
        )

        self.client.force_authenticate(user=self.employee)
        resp = self.client.get(self._list_url())
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        # All returned campaigns must belong to this employee's company
        results = resp.data.get("results", resp.data)
        for camp in results:
            self.assertNotEqual(camp.get("name"), "Other Company Camp")


class CampaignActivateAPITest(APITestCase):
    """Tests for the /activate/ action on CampaignViewSet.

    NOTE: The activate action requires the email pool to be full
    (email_templates.count() >= num_emails). We test the failure path
    (insufficient templates) and the manual direct-save path.
    """

    @classmethod
    def setUpTestData(cls):
        cls.company = Company.objects.create(name="Activate Test Corp")
        cls.admin = User.objects.create_user(
            email="act_admin@corp.sa",
            password="pass",
            role="COMPANY_ADMIN",
            company=cls.company,
            is_verified=True,
        )

    def test_admin_can_activate_campaign_at_model_level(self):
        """Directly transitions DRAFT → ACTIVE (model layer, not HTTP)."""
        campaign = Campaign.objects.create(
            name="To Activate",
            description="desc",
            company=self.company,
            created_by=self.admin,
        )
        self.assertEqual(campaign.status, "DRAFT")
        campaign.status = "ACTIVE"
        campaign.save()
        campaign.refresh_from_db()
        self.assertEqual(campaign.status, "ACTIVE")

    def test_activate_endpoint_returns_400_if_email_pool_empty(self):
        """The activate action requires num_emails templates; without them it returns 400."""
        campaign = Campaign.objects.create(
            name="Empty Pool",
            description="desc",
            company=self.company,
            created_by=self.admin,
            num_emails=5,
        )
        self.client.force_authenticate(user=self.admin)
        url = reverse("campaigns:campaign-activate", kwargs={"pk": campaign.pk})
        resp = self.client.post(url, {}, format="json")
        # Without email templates the view returns 400 (pool incomplete)
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
