"""
Integration tests for the Assessments API (EmailTemplateViewSet).

Endpoints under test (mounted at /api/v1/assessments/):
  GET    email-templates/            - list templates (scoped to user's company campaigns)
  POST   email-templates/            - create template (admin only)
  GET    email-templates/<id>/       - retrieve single template

Permissions:
- create/update/delete: IsAuthenticated + IsCompanyAdmin
- list/retrieve: IsAuthenticated
"""

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.companies.models import Company
from apps.campaigns.models import Campaign
from apps.assessments.models import EmailTemplate
from django.contrib.auth import get_user_model

User = get_user_model()


class EmailTemplateAPITest(APITestCase):

    @classmethod
    def setUpTestData(cls):
        cls.company = Company.objects.create(name="Assess API Corp")
        cls.admin = User.objects.create_user(
            email="assess_api_admin@corp.sa",
            password="pass",
            role="COMPANY_ADMIN",
            company=cls.company,
            is_verified=True,
        )
        cls.employee = User.objects.create_user(
            email="assess_api_emp@corp.sa",
            password="pass",
            role="EMPLOYEE",
            company=cls.company,
            is_verified=True,
        )
        cls.campaign = Campaign.objects.create(
            name="Assess API Campaign",
            description="For API tests",
            company=cls.company,
            created_by=cls.admin,
        )

    def _list_url(self):
        return reverse("assessments:emailtemplate-list")

    def _template_payload(self):
        return {
            "campaign": self.campaign.pk,
            "sender_name": "Fake CEO",
            "sender_email": "ceo@fakecorp.sa",
            "subject": "Urgent wire transfer",
            "body": "<p>Please process this payment immediately.</p>",
            "email_type": "PHISHING",
            "category": "BUSINESS_EMAIL_COMPROMISE",
            "difficulty": "HARD",
        }

    # ------------------------------------------------------------------
    # Authentication
    # ------------------------------------------------------------------

    def test_unauthenticated_cannot_list_templates(self):
        resp = self.client.get(self._list_url())
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    # ------------------------------------------------------------------
    # Create (admin only)
    # ------------------------------------------------------------------

    def test_admin_can_create_email_template(self):
        self.client.force_authenticate(user=self.admin)
        resp = self.client.post(self._list_url(), self._template_payload(), format="json")
        self.assertIn(resp.status_code, [status.HTTP_201_CREATED, status.HTTP_200_OK])
        self.assertTrue(
            EmailTemplate.objects.filter(
                campaign=self.campaign,
                email_type="PHISHING",
            ).exists()
        )

    def test_employee_cannot_create_email_template(self):
        self.client.force_authenticate(user=self.employee)
        resp = self.client.post(self._list_url(), self._template_payload(), format="json")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    # ------------------------------------------------------------------
    # List / Retrieve (authenticated users)
    # ------------------------------------------------------------------

    def test_authenticated_employee_can_list_templates(self):
        EmailTemplate.objects.create(
            campaign=self.campaign,
            sender_name="Test Sender",
            sender_email="test@phish.sa",
            subject="List Test",
            body="<p>body</p>",
            email_type="PHISHING",
            category="CREDENTIAL_HARVESTING",
        )
        self.client.force_authenticate(user=self.employee)
        resp = self.client.get(self._list_url())
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
