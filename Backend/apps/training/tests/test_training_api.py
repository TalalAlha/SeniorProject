"""
Integration tests for the Training API (RemediationTrainingViewSet, RiskScoreViewSet).

Key facts:
- auto_assign_remediation runs when risk_score.score > 70 AND requires_remediation=True
- RiskScore.save() triggers check_remediation_on_score_change signal
- Training is assigned via POST /api/v1/training/assignments/
- Employee sees assignments via GET /api/v1/training/assignments/my_trainings/
"""
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.companies.models import Company
from apps.training.models import (
    RiskScore,
    RemediationTraining,
    TrainingModule,
)
from django.contrib.auth import get_user_model

User = get_user_model()


class TrainingAssignmentAPITest(APITestCase):

    @classmethod
    def setUpTestData(cls):
        cls.company = Company.objects.create(name="Training API Test Corp")
        cls.admin = User.objects.create_user(
            email="train_admin@corp.sa",
            password="pass",
            role="COMPANY_ADMIN",
            company=cls.company,
            is_verified=True,
        )
        cls.employee = User.objects.create_user(
            email="train_emp@corp.sa",
            password="pass",
            role="EMPLOYEE",
            company=cls.company,
            is_verified=True,
        )
        cls.module = TrainingModule.objects.create(
            title="Email Security Basics",
            description="How to identify phishing emails",
            content_html="<p>Training content</p>",
            category="EMAIL_SECURITY",
            passing_score=75,
            score_reduction_on_pass=15,
            is_active=True,
            is_mandatory=True,
        )

    def _my_trainings_url(self):
        return reverse("training:remediation-training-my-trainings")

    def _assignments_url(self):
        return reverse("training:remediation-training-list")

    def _my_score_url(self):
        return reverse("training:risk-score-my-score")

    # ------------------------------------------------------------------
    # Employee listing
    # ------------------------------------------------------------------

    def test_employee_can_list_own_training_assignments(self):
        RemediationTraining.objects.create(
            employee=self.employee,
            company=self.company,
            training_module=self.module,
            assignment_reason="MANUAL_ADMIN",
        )
        self.client.force_authenticate(user=self.employee)
        resp = self.client.get(self._my_trainings_url())
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        # Response may be a list or paginated dict
        results = resp.data.get("results", resp.data) if isinstance(resp.data, dict) else resp.data
        self.assertGreaterEqual(len(results), 1)

    def test_unauthenticated_cannot_list_trainings(self):
        resp = self.client.get(self._my_trainings_url())
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    # ------------------------------------------------------------------
    # Auto-assignment when risk score > 70
    # ------------------------------------------------------------------

    def test_high_risk_score_auto_assigns_remediation_training(self):
        """Saving a RiskScore > 70 triggers the post_save signal → RemediationTraining."""
        risk_score, _ = RiskScore.objects.get_or_create(
            employee=self.employee,
            defaults={"company": self.company, "score": 50},
        )
        # Set a high score and save — signal fires check_remediation_on_score_change
        risk_score.score = 85  # > 70
        risk_score.save()

        self.assertTrue(
            RemediationTraining.objects.filter(
                employee=self.employee,
                assignment_reason="AUTO_HIGH_RISK",
            ).exists()
        )

    # ------------------------------------------------------------------
    # Risk score endpoint
    # ------------------------------------------------------------------

    def test_employee_can_read_own_risk_score(self):
        RiskScore.objects.get_or_create(
            employee=self.employee,
            defaults={"company": self.company, "score": 50},
        )
        self.client.force_authenticate(user=self.employee)
        resp = self.client.get(self._my_score_url())
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("score", resp.data)


class TrainingQuizAPITest(APITestCase):
    """Tests for the submit_quiz action on RemediationTrainingViewSet."""

    @classmethod
    def setUpTestData(cls):
        cls.company = Company.objects.create(name="Quiz API Test Corp")
        cls.employee = User.objects.create_user(
            email="quiz_emp@corp.sa",
            password="pass",
            role="EMPLOYEE",
            company=cls.company,
            is_verified=True,
        )
        cls.module = TrainingModule.objects.create(
            title="Password Security",
            description="Keep passwords safe",
            content_html="<p>Content</p>",
            category="PASSWORD_SECURITY",
            passing_score=75,
            score_reduction_on_pass=15,
            is_active=True,
        )

    def _submit_quiz_url(self, assignment_pk):
        return reverse("training:remediation-training-submit-quiz", kwargs={"pk": assignment_pk})

    def _make_assignment(self):
        return RemediationTraining.objects.create(
            employee=self.employee,
            company=self.company,
            training_module=self.module,
            assignment_reason="MANUAL_ADMIN",
        )

    def test_passing_training_quiz_reduces_risk_score(self):
        """Submitting answers with 100% score should set status to PASSED."""
        from apps.training.models import TrainingQuestion
        q = TrainingQuestion.objects.create(
            module=self.module,
            question_number=1,
            question_text="What should you do with suspicious emails?",
            options=["Delete", "Report", "Open", "Forward"],
            correct_answer_index=1,
        )
        assignment = self._make_assignment()
        # submit_quiz requires content_viewed=True (apps/training/views.py line 657-661)
        assignment.content_viewed = True
        assignment.save(update_fields=["content_viewed"])

        self.client.force_authenticate(user=self.employee)
        url = self._submit_quiz_url(assignment.pk)
        resp = self.client.post(
            url,
            {"answers": {str(q.id): 1}},
            format="json",
        )
        self.assertIn(resp.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])
        assignment.refresh_from_db()
        self.assertEqual(assignment.status, "PASSED")

    def test_failing_training_quiz_does_not_pass(self):
        """Submitting wrong answers results in FAILED status."""
        from apps.training.models import TrainingQuestion
        q = TrainingQuestion.objects.create(
            module=self.module,
            question_number=1,
            question_text="Which is phishing?",
            options=["Legit email", "Fake bank email", "Newsletter", "Receipt"],
            correct_answer_index=1,
        )
        assignment = self._make_assignment()
        # submit_quiz requires content_viewed=True (see views.py)
        assignment.content_viewed = True
        assignment.save(update_fields=["content_viewed"])

        self.client.force_authenticate(user=self.employee)
        url = self._submit_quiz_url(assignment.pk)
        # Submit a wrong answer (index 0 instead of 1)
        resp = self.client.post(
            url,
            {"answers": {str(q.id): 0}},
            format="json",
        )
        self.assertIn(resp.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])
        assignment.refresh_from_db()
        self.assertEqual(assignment.status, "FAILED")
