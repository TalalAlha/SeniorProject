"""
Unit tests for TrackingEvent.save() side-effect chain.

Save order (from simulations/models.py):
  super().save() → _update_simulation_stats() → _update_campaign_stats()

Covers:
- EMAIL_OPENED  → EmailSimulation.was_opened = True
- LINK_CLICKED  → EmailSimulation.was_clicked = True
- CREDENTIALS_ENTERED → EmailSimulation.credentials_entered = True
- Campaign denormalized counters (total_opened / total_clicked) update
"""

from django.test import TestCase

from apps.companies.models import Company
from apps.simulations.models import (
    SimulationTemplate,
    SimulationCampaign,
    EmailSimulation,
    TrackingEvent,
)
from django.contrib.auth import get_user_model

User = get_user_model()


class TrackingEventTestCase(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.company = Company.objects.create(name="Sim Tracking Test Corp")

        cls.admin = User.objects.create_user(
            email="simadmin@corp.sa",
            password="pass",
            role="COMPANY_ADMIN",
            company=cls.company,
            is_verified=True,
        )
        cls.employee = User.objects.create_user(
            email="simemployee@corp.sa",
            password="pass",
            role="EMPLOYEE",
            company=cls.company,
            is_verified=True,
        )

        cls.template = SimulationTemplate.objects.create(
            name="Test Template",
            description="Phishing test template",
            sender_name="IT Security",
            sender_email="security@fake-it.sa",
            subject="Urgent: Verify your account",
            body_html="<p>Click <a href='{LURE_LINK}'>here</a></p>",
            attack_vector="LINK_MANIPULATION",
            difficulty="MEDIUM",
        )

    def _make_campaign_and_sim(self):
        """Helper: create one SimulationCampaign + one EmailSimulation (SENT)."""
        campaign = SimulationCampaign.objects.create(
            name="Test Campaign",
            description="Test",
            company=self.company,
            created_by=self.admin,
            template=self.template,
            status="IN_PROGRESS",
        )
        campaign.target_employees.add(self.employee)
        email_sim = EmailSimulation.objects.create(
            campaign=campaign,
            employee=self.employee,
            recipient_email=self.employee.email,
            status="SENT",
        )
        # Reflect the sent email in campaign counter
        campaign.total_sent = 1
        campaign.save(update_fields=["total_sent"])
        return campaign, email_sim

    # ------------------------------------------------------------------
    # EMAIL_OPENED
    # ------------------------------------------------------------------

    def test_email_opened_event_flips_was_opened_flag(self):
        campaign, email_sim = self._make_campaign_and_sim()
        self.assertFalse(email_sim.was_opened)

        TrackingEvent.objects.create(
            email_simulation=email_sim,
            campaign=campaign,
            employee=self.employee,
            event_type="EMAIL_OPENED",
        )

        email_sim.refresh_from_db()
        self.assertTrue(email_sim.was_opened)

    # ------------------------------------------------------------------
    # LINK_CLICKED
    # ------------------------------------------------------------------

    def test_link_clicked_event_flips_was_clicked_flag(self):
        campaign, email_sim = self._make_campaign_and_sim()
        self.assertFalse(email_sim.was_clicked)

        TrackingEvent.objects.create(
            email_simulation=email_sim,
            campaign=campaign,
            employee=self.employee,
            event_type="LINK_CLICKED",
        )

        email_sim.refresh_from_db()
        self.assertTrue(email_sim.was_clicked)

    # ------------------------------------------------------------------
    # CREDENTIALS_ENTERED
    # ------------------------------------------------------------------

    def test_credentials_event_flips_was_compromised_flag(self):
        campaign, email_sim = self._make_campaign_and_sim()
        self.assertFalse(email_sim.credentials_entered)

        TrackingEvent.objects.create(
            email_simulation=email_sim,
            campaign=campaign,
            employee=self.employee,
            event_type="CREDENTIALS_ENTERED",
        )

        email_sim.refresh_from_db()
        self.assertTrue(email_sim.credentials_entered)

    # ------------------------------------------------------------------
    # Campaign denormalized counters
    # ------------------------------------------------------------------

    def test_campaign_denormalized_counters_update(self):
        """After an EMAIL_OPENED event, campaign.total_opened should be 1."""
        campaign, email_sim = self._make_campaign_and_sim()
        self.assertEqual(campaign.total_opened, 0)

        TrackingEvent.objects.create(
            email_simulation=email_sim,
            campaign=campaign,
            employee=self.employee,
            event_type="EMAIL_OPENED",
        )

        campaign.refresh_from_db()
        self.assertEqual(campaign.total_opened, 1)

    def test_campaign_total_clicked_updates_on_link_click(self):
        campaign, email_sim = self._make_campaign_and_sim()
        self.assertEqual(campaign.total_clicked, 0)

        TrackingEvent.objects.create(
            email_simulation=email_sim,
            campaign=campaign,
            employee=self.employee,
            event_type="LINK_CLICKED",
        )

        campaign.refresh_from_db()
        self.assertEqual(campaign.total_clicked, 1)

    def test_duplicate_opened_event_does_not_double_count(self):
        """A second EMAIL_OPENED for the same sim should not increment twice."""
        campaign, email_sim = self._make_campaign_and_sim()

        TrackingEvent.objects.create(
            email_simulation=email_sim,
            campaign=campaign,
            employee=self.employee,
            event_type="EMAIL_OPENED",
        )
        TrackingEvent.objects.create(
            email_simulation=email_sim,
            campaign=campaign,
            employee=self.employee,
            event_type="EMAIL_OPENED",
        )

        campaign.refresh_from_db()
        # _update_campaign_stats counts all simulations with was_opened=True
        self.assertEqual(campaign.total_opened, 1)
