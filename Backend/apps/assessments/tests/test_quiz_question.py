"""
Unit tests for the assessments QuizQuestion model.

Key model facts:
- QuizQuestion.correct_answer returns 'PHISHING' if email_template.is_phishing else 'LEGITIMATE'
- QuizQuestion.check_answer() sets is_correct and returns True/False/None
- check_answer() sets requires_training=True when wrong answer on a PHISHING email
- check_answer() returns None when answer is None
"""

from django.test import TestCase

from apps.companies.models import Company
from apps.campaigns.models import Campaign, Quiz
from apps.assessments.models import EmailTemplate, QuizQuestion
from django.contrib.auth import get_user_model

User = get_user_model()


class QuizQuestionModelTestCase(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.company = Company.objects.create(name="Quiz Question Corp")
        cls.admin = User.objects.create_user(
            email="qq_admin@corp.sa",
            password="pass",
            role="COMPANY_ADMIN",
            company=cls.company,
            is_verified=True,
        )
        cls.employee = User.objects.create_user(
            email="qq_emp@corp.sa",
            password="pass",
            role="EMPLOYEE",
            company=cls.company,
            is_verified=True,
        )
        cls.campaign = Campaign.objects.create(
            name="QQ Campaign",
            description="For quiz question tests",
            company=cls.company,
            created_by=cls.admin,
        )
        cls.quiz = Quiz.objects.create(
            campaign=cls.campaign,
            employee=cls.employee,
        )
        cls.phishing_template = EmailTemplate.objects.create(
            campaign=cls.campaign,
            sender_name="Fake Bank",
            sender_email="noreply@fakebank.sa",
            subject="Your account is at risk",
            body="<p>Click to verify your account.</p>",
            email_type="PHISHING",
            category="CREDENTIAL_HARVESTING",
        )
        cls.legit_template = EmailTemplate.objects.create(
            campaign=cls.campaign,
            sender_name="HR Department",
            sender_email="hr@corp.sa",
            subject="Monthly payslip ready",
            body="<p>Your payslip is ready in the portal.</p>",
            email_type="LEGITIMATE",
            category="LEGITIMATE_BUSINESS",
        )

    def _make_question(self, template, number=1):
        return QuizQuestion(
            quiz=self.quiz,
            email_template=template,
            question_number=number,
        )

    # ------------------------------------------------------------------
    # correct_answer property
    # ------------------------------------------------------------------

    def test_correct_answer_is_phishing_for_phishing_template(self):
        q = self._make_question(self.phishing_template)
        self.assertEqual(q.correct_answer, "PHISHING")

    def test_correct_answer_is_legitimate_for_legit_template(self):
        q = self._make_question(self.legit_template, number=2)
        self.assertEqual(q.correct_answer, "LEGITIMATE")

    # ------------------------------------------------------------------
    # check_answer() — correct path
    # ------------------------------------------------------------------

    def test_check_answer_returns_true_when_answer_matches_phishing(self):
        q = self._make_question(self.phishing_template)
        q.answer = "PHISHING"
        result = q.check_answer()
        self.assertTrue(result)
        self.assertTrue(q.is_correct)

    def test_check_answer_returns_true_when_answer_matches_legitimate(self):
        q = self._make_question(self.legit_template, number=2)
        q.answer = "LEGITIMATE"
        result = q.check_answer()
        self.assertTrue(result)
        self.assertTrue(q.is_correct)

    # ------------------------------------------------------------------
    # check_answer() — wrong answer path
    # ------------------------------------------------------------------

    def test_check_answer_returns_false_for_wrong_answer(self):
        q = self._make_question(self.phishing_template)
        q.answer = "LEGITIMATE"  # wrong — email is PHISHING
        result = q.check_answer()
        self.assertFalse(result)
        self.assertFalse(q.is_correct)

    def test_wrong_answer_on_phishing_sets_requires_training(self):
        """Missing a phishing email flags the employee for remediation training."""
        q = self._make_question(self.phishing_template)
        q.answer = "LEGITIMATE"
        q.check_answer()
        self.assertTrue(q.requires_training)

    def test_wrong_answer_on_legit_does_not_set_requires_training(self):
        """Incorrectly marking a legit email does NOT trigger training flag."""
        q = self._make_question(self.legit_template, number=2)
        q.answer = "PHISHING"
        q.check_answer()
        self.assertFalse(q.requires_training)

    # ------------------------------------------------------------------
    # check_answer() — no answer yet
    # ------------------------------------------------------------------

    def test_check_answer_returns_none_when_no_answer(self):
        q = self._make_question(self.phishing_template)
        q.answer = None
        result = q.check_answer()
        self.assertIsNone(result)
        self.assertIsNone(q.is_correct)
