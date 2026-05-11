"""
Unit tests for the Campaign model lifecycle and field validation.

Key facts (from campaigns/models.py):
- Campaign.status defaults to 'DRAFT'
- num_emails validated 5–50 at DB level via MinValueValidator/MaxValueValidator
- phishing_ratio validated 0.2–0.8
- activate action is on CampaignViewSet (not a model method)
"""
from decimal import Decimal

from django.core.exceptions import ValidationError
from django.test import TestCase

from apps.campaigns.models import Campaign
from apps.companies.models import Company
from django.contrib.auth import get_user_model

User = get_user_model()


class CampaignModelTest(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.company = Company.objects.create(name="Campaign Lifecycle Test Corp")
        cls.admin = User.objects.create_user(
            email="campaign_admin@corp.sa",
            password="pass",
            role="COMPANY_ADMIN",
            company=cls.company,
            is_verified=True,
        )

    def _make_campaign(self, **kwargs):
        defaults = dict(
            name="Test Campaign",
            description="A test campaign",
            company=self.company,
            created_by=self.admin,
            num_emails=10,
            phishing_ratio=Decimal("0.5"),
        )
        defaults.update(kwargs)
        return Campaign(**defaults)

    # ------------------------------------------------------------------
    # Default status
    # ------------------------------------------------------------------

    def test_campaign_default_status_is_draft(self):
        campaign = self._make_campaign()
        campaign.save()
        campaign.refresh_from_db()
        self.assertEqual(campaign.status, "DRAFT")

    # ------------------------------------------------------------------
    # Computed properties
    # ------------------------------------------------------------------

    def test_num_phishing_emails_property(self):
        campaign = self._make_campaign(num_emails=10, phishing_ratio=Decimal("0.5"))
        # 10 * 0.5 = 5
        self.assertEqual(campaign.num_phishing_emails, 5)
        self.assertEqual(campaign.num_legitimate_emails, 5)

    def test_completion_rate_is_zero_with_no_participants(self):
        campaign = self._make_campaign()
        campaign.save()
        self.assertEqual(campaign.completion_rate, 0)

    # ------------------------------------------------------------------
    # Validator enforcement via full_clean()
    # ------------------------------------------------------------------

    def test_campaign_phishing_ratio_must_be_between_0_2_and_0_8(self):
        campaign = self._make_campaign(phishing_ratio=Decimal("0.1"))
        with self.assertRaises(ValidationError):
            campaign.full_clean()

        campaign2 = self._make_campaign(phishing_ratio=Decimal("0.9"))
        with self.assertRaises(ValidationError):
            campaign2.full_clean()

    def test_campaign_num_emails_must_be_between_5_and_50(self):
        too_few = self._make_campaign(num_emails=3)
        with self.assertRaises(ValidationError):
            too_few.full_clean()

        too_many = self._make_campaign(num_emails=51)
        with self.assertRaises(ValidationError):
            too_many.full_clean()

    def test_campaign_valid_phishing_ratio_boundary_passes(self):
        for ratio in (Decimal("0.2"), Decimal("0.5"), Decimal("0.8")):
            c = self._make_campaign(phishing_ratio=ratio)
            # Should not raise
            c.full_clean()

    def test_campaign_valid_num_emails_boundaries_pass(self):
        for n in (5, 25, 50):
            c = self._make_campaign(num_emails=n)
            c.full_clean()

    # ------------------------------------------------------------------
    # Status transitions (model-level; view-level tested in test_campaign_api.py)
    # ------------------------------------------------------------------

    def test_campaign_publish_transitions_draft_to_active(self):
        """Directly setting status to ACTIVE and saving works at the model layer."""
        campaign = self._make_campaign()
        campaign.save()
        self.assertEqual(campaign.status, "DRAFT")

        campaign.status = "ACTIVE"
        campaign.save()
        campaign.refresh_from_db()
        self.assertEqual(campaign.status, "ACTIVE")
