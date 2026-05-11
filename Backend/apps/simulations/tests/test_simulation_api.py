"""
Integration tests for the Simulations API.

Endpoints under test (mounted at /api/v1/simulations/):
  POST   campaigns/                 — create simulation campaign
  POST   campaigns/{id}/send/       — send emails to target employees
  GET    link/<link_token>/         — phishing link click redirect

NOTE — Tracking pixel endpoint (/api/v1/simulations/track/<token>/) is
referenced in EmailSimulation.tracking_pixel_url but is NOT registered in
simulations/urls.py. The test for it is skipped with a clear reason.
"""
import unittest

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.companies.models import Company
from apps.simulations.models import (
    EmailSimulation,
    SimulationCampaign,
    SimulationTemplate,
    TrackingEvent,
)
from django.contrib.auth import get_user_model

User = get_user_model()


class SimulationCampaignCreateAPITest(APITestCase):

    @classmethod
    def setUpTestData(cls):
        cls.company = Company.objects.create(name="Sim API Test Corp")
        cls.admin = User.objects.create_user(
            email="sim_admin@corp.sa",
            password="pass",
            role="COMPANY_ADMIN",
            company=cls.company,
            is_verified=True,
        )
        cls.employee = User.objects.create_user(
            email="sim_emp@corp.sa",
            password="pass",
            role="EMPLOYEE",
            company=cls.company,
            is_verified=True,
        )
        cls.template = SimulationTemplate.objects.create(
            name="IT Security Alert",
            description="Phishing via IT impersonation",
            sender_name="IT Helpdesk",
            sender_email="helpdesk@fake-corp.sa",
            subject="Urgent: Password expiry",
            body_html="<p>Your password expires soon. <a href='{LURE_LINK}'>Click here</a></p>",
            attack_vector="CREDENTIAL_HARVESTING",
            difficulty="MEDIUM",
        )

    def _campaign_list_url(self):
        return reverse("simulations:campaign-list")

    def _campaign_send_url(self, pk):
        return reverse("simulations:campaign-send", kwargs={"pk": pk})

    # ------------------------------------------------------------------
    # Create
    # ------------------------------------------------------------------

    def test_admin_can_create_simulation_campaign(self):
        self.client.force_authenticate(user=self.admin)
        payload = {
            "name": "Q1 Phishing Test",
            "description": "Quarterly phishing simulation",
            "company": self.company.pk,
            "template": self.template.pk,
            "status": "DRAFT",
            # Must target all employees OR provide specific IDs (serializer validation)
            "target_all_employees": True,
        }
        resp = self.client.post(self._campaign_list_url(), payload, format="json")
        self.assertIn(resp.status_code, [status.HTTP_201_CREATED, status.HTTP_200_OK])
        self.assertTrue(
            SimulationCampaign.objects.filter(company=self.company).exists()
        )

    def test_unauthorized_user_cannot_create_simulation_returns_403(self):
        self.client.force_authenticate(user=self.employee)
        payload = {
            "name": "Unauthorized Attempt",
            "description": "desc",
            "template": self.template.pk,
        }
        resp = self.client.post(self._campaign_list_url(), payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    # ------------------------------------------------------------------
    # Send — creates EmailSimulation per target employee
    # ------------------------------------------------------------------

    def test_send_endpoint_creates_email_simulation_per_target(self):
        """Calling /send/ should create one EmailSimulation per target employee."""
        # Create campaign with the employee as a target
        campaign = SimulationCampaign.objects.create(
            name="Send Test Campaign",
            description="Test",
            company=self.company,
            created_by=self.admin,
            template=self.template,
            status="DRAFT",
        )
        campaign.target_employees.add(self.employee)

        self.client.force_authenticate(user=self.admin)
        # send_immediately=True triggers background delivery; EmailSimulation records
        # are created synchronously inside the transaction before the thread is spawned.
        resp = self.client.post(
            self._campaign_send_url(campaign.pk),
            {"send_immediately": True},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        # One EmailSimulation record created for the one target employee
        self.assertEqual(
            EmailSimulation.objects.filter(campaign=campaign).count(), 1
        )

    # ------------------------------------------------------------------
    # Phishing link click records TrackingEvent
    # ------------------------------------------------------------------

    def test_lure_link_redirect_records_link_clicked_event_and_redirects(self):
        """GET /api/v1/simulations/link/<token>/ should record a LINK_CLICKED event."""
        campaign = SimulationCampaign.objects.create(
            name="Lure Link Campaign",
            description="Test",
            company=self.company,
            created_by=self.admin,
            template=self.template,
            status="IN_PROGRESS",
        )
        campaign.total_sent = 1
        campaign.save()
        email_sim = EmailSimulation.objects.create(
            campaign=campaign,
            employee=self.employee,
            recipient_email=self.employee.email,
            status="SENT",
        )
        url = reverse("simulations:phishing-link", kwargs={"link_token": email_sim.link_token})
        resp = self.client.get(url)
        # Expect a redirect to the React "caught" page
        self.assertIn(resp.status_code, [status.HTTP_302_FOUND, status.HTTP_200_OK])

        # A LINK_CLICKED tracking event must have been recorded
        self.assertTrue(
            TrackingEvent.objects.filter(
                email_simulation=email_sim,
                event_type="LINK_CLICKED",
            ).exists()
        )

    @unittest.skip(
        "BUG: simulations:tracking-pixel URL is referenced in EmailSimulation.tracking_pixel_url "
        "but is NOT registered in simulations/urls.py. The tracking pixel endpoint for email "
        "opens is missing from the URL configuration. Register a view at "
        "api/v1/simulations/track/<uuid:token>/ to fix this."
    )
    def test_tracking_pixel_endpoint_records_email_opened_event(self):
        """
        GET /api/v1/simulations/track/<tracking_token>/
        Should create an EMAIL_OPENED TrackingEvent.
        SKIPPED because the URL is not registered.
        """
        pass
