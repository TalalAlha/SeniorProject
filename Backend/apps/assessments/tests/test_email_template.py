"""
Unit tests for the assessments EmailTemplate model.

Key model facts:
- EmailTemplate.is_phishing returns True iff email_type == 'PHISHING'
- EmailTemplate belongs to a Campaign (FK)
- category choices include PHISHING and LEGITIMATE types
"""

from django.test import TestCase

from apps.companies.models import Company
from apps.campaigns.models import Campaign
from apps.assessments.models import EmailTemplate
from django.contrib.auth import get_user_model

User = get_user_model()


class EmailTemplateModelTestCase(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.company = Company.objects.create(name="Assessments Test Corp")
        cls.admin = User.objects.create_user(
            email="assess_admin@corp.sa",
            password="pass",
            role="COMPANY_ADMIN",
            company=cls.company,
            is_verified=True,
        )
        cls.campaign = Campaign.objects.create(
            name="Assess Campaign",
            description="For assessment tests",
            company=cls.company,
            created_by=cls.admin,
        )

    def _make_template(self, email_type="PHISHING", category="CREDENTIAL_HARVESTING"):
        return EmailTemplate.objects.create(
            campaign=self.campaign,
            sender_name="IT Helpdesk",
            sender_email="helpdesk@fake.sa",
            subject="Urgent: Password Reset Required",
            body="<p>Click here to reset your password.</p>",
            email_type=email_type,
            category=category,
        )

    # ------------------------------------------------------------------
    # is_phishing property
    # ------------------------------------------------------------------

    def test_is_phishing_true_for_phishing_email_type(self):
        template = self._make_template(email_type="PHISHING")
        self.assertTrue(template.is_phishing)

    def test_is_phishing_false_for_legitimate_email_type(self):
        template = self._make_template(
            email_type="LEGITIMATE", category="LEGITIMATE_BUSINESS"
        )
        self.assertFalse(template.is_phishing)

    # ------------------------------------------------------------------
    # str representation
    # ------------------------------------------------------------------

    def test_str_includes_email_type_and_subject(self):
        template = self._make_template()
        result = str(template)
        self.assertIn("PHISHING", result)
        self.assertIn("Urgent: Password Reset Required"[:50], result)

    # ------------------------------------------------------------------
    # AI generation flag
    # ------------------------------------------------------------------

    def test_is_ai_generated_defaults_to_false(self):
        template = self._make_template()
        self.assertFalse(template.is_ai_generated)

    def test_ai_generated_template_persists_flag(self):
        template = EmailTemplate.objects.create(
            campaign=self.campaign,
            sender_name="AI Bot",
            sender_email="ai@phishaware.sa",
            subject="AI Generated Phishing Test",
            body="<p>Test.</p>",
            email_type="PHISHING",
            category="SPEAR_PHISHING",
            is_ai_generated=True,
            ai_model_used="claude-3-5-sonnet",
        )
        template.refresh_from_db()
        self.assertTrue(template.is_ai_generated)
        self.assertEqual(template.ai_model_used, "claude-3-5-sonnet")
