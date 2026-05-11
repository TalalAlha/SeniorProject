"""
Unit tests for RiskScore model and recalculate_score() algorithm.

Actual risk-level thresholds (from training/models.py calculate_risk_level()):
  score <= 30  → LOW
  score <= 60  → MEDIUM
  score <= 80  → HIGH
  score > 80   → CRITICAL

recalculate_score() algorithm (base = 50):
  quiz_adjustment    = int((0.5 - accuracy) * 40)       # -20 to +20
  phishing_penalty   = min(missed * 5, 25)
  simulation_adj     = int(click_rate * 30) if sims > 0 else 0
  credential_penalty = min(credentials_entered * 15, 20)
  report_bonus       = min(simulations_reported * 5, 15)  # subtracted
  training_bonus     = min(trainings_passed * 10, 25)     # subtracted
"""

from django.test import TestCase

from apps.companies.models import Company
from apps.training.models import RiskScore
from django.contrib.auth import get_user_model

User = get_user_model()


class RiskScoreModelTest(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.company = Company.objects.create(name="Risk Score Test Corp")
        cls.employee = User.objects.create_user(
            email="risk_employee@corp.sa",
            password="pass",
            role="EMPLOYEE",
            company=cls.company,
            is_verified=True,
        )

    def _fresh_score(self):
        """Return an unsaved RiskScore with neutral stats."""
        return RiskScore(
            employee=self.employee,
            company=self.company,
            score=50,
            risk_level="MEDIUM",
        )

    # ------------------------------------------------------------------
    # Initial state
    # ------------------------------------------------------------------

    def test_initial_score_starts_at_50_neutral(self):
        rs = RiskScore(
            employee=self.employee,
            company=self.company,
        )
        self.assertEqual(rs.score, 50)
        self.assertEqual(rs.risk_level, "MEDIUM")

    # ------------------------------------------------------------------
    # recalculate_score() — quiz accuracy
    # ------------------------------------------------------------------

    def test_high_quiz_accuracy_lowers_score(self):
        """90% accuracy: quiz_adjustment = int((0.5 - 0.9) * 40) = -16 → score = 34."""
        rs = self._fresh_score()
        rs.total_quiz_questions = 10
        rs.correct_quiz_answers = 9  # 90% accuracy
        new_score = rs.recalculate_score()
        # expected: 50 + (-16) = 34
        self.assertLess(new_score, 50)
        self.assertEqual(new_score, 34)

    def test_zero_quiz_accuracy_raises_score(self):
        """0% accuracy: quiz_adjustment = int((0.5 - 0.0) * 40) = 20 → score = 70."""
        rs = self._fresh_score()
        rs.total_quiz_questions = 10
        rs.correct_quiz_answers = 0
        new_score = rs.recalculate_score()
        self.assertGreater(new_score, 50)
        self.assertEqual(new_score, 70)

    # ------------------------------------------------------------------
    # Simulation clicks raise score
    # ------------------------------------------------------------------

    def test_simulation_clicks_raise_score(self):
        """100% click rate: simulation_adj = int(1.0 * 30) = 30 → score = 80."""
        rs = self._fresh_score()
        rs.total_simulations_received = 4
        rs.simulations_clicked = 4  # 100% click rate
        new_score = rs.recalculate_score()
        self.assertGreater(new_score, 50)
        self.assertEqual(new_score, 80)

    def test_no_simulations_received_no_adjustment(self):
        """Guard: if no simulations received, simulation_adjustment must be 0."""
        rs = self._fresh_score()
        rs.total_simulations_received = 0
        rs.simulations_clicked = 0
        new_score = rs.recalculate_score()
        self.assertEqual(new_score, 50)

    # ------------------------------------------------------------------
    # Phishing reports lower score
    # ------------------------------------------------------------------

    def test_phishing_reports_lower_score(self):
        """3 reports: report_bonus = min(3*5, 15) = 15 → score = 50 - 15 = 35."""
        rs = self._fresh_score()
        rs.simulations_reported = 3
        new_score = rs.recalculate_score()
        self.assertLess(new_score, 50)
        self.assertEqual(new_score, 35)

    # ------------------------------------------------------------------
    # Score clamping
    # ------------------------------------------------------------------

    def test_score_clamped_to_0_100_range(self):
        """Extreme positive inputs must not push score above 100."""
        rs = self._fresh_score()
        rs.total_simulations_received = 10
        rs.simulations_clicked = 10        # +30
        rs.credentials_entered = 5         # penalty = min(75, 20) = 20
        rs.phishing_emails_missed = 10     # penalty = min(50, 25) = 25
        rs.total_quiz_questions = 10
        rs.correct_quiz_answers = 0        # +20
        new_score = rs.recalculate_score()
        self.assertLessEqual(new_score, 100)
        self.assertGreaterEqual(new_score, 0)

    def test_score_clamped_to_minimum_0(self):
        """Extreme negative inputs must not push score below 0."""
        rs = self._fresh_score()
        rs.total_quiz_questions = 10
        rs.correct_quiz_answers = 10       # accuracy 1.0 → -20
        rs.simulations_reported = 10       # bonus = min(50, 15) = 15
        rs.trainings_passed = 10           # bonus = min(100, 25) = 25
        new_score = rs.recalculate_score()
        self.assertGreaterEqual(new_score, 0)

    # ------------------------------------------------------------------
    # Risk-level classification boundaries
    # ------------------------------------------------------------------

    def test_risk_level_classification_boundaries(self):
        """Verify thresholds: ≤30 LOW, 31-60 MEDIUM, 61-80 HIGH, >80 CRITICAL."""
        rs = self._fresh_score()

        boundary_cases = [
            (0,   "LOW"),
            (30,  "LOW"),
            (31,  "MEDIUM"),
            (60,  "MEDIUM"),
            (61,  "HIGH"),
            (80,  "HIGH"),
            (81,  "CRITICAL"),
            (100, "CRITICAL"),
        ]
        for score, expected_level in boundary_cases:
            rs.score = score
            level = rs.calculate_risk_level()
            self.assertEqual(
                level, expected_level,
                f"score={score} should be {expected_level}, got {level}"
            )

    def test_requires_remediation_flag_set_above_70(self):
        rs = self._fresh_score()
        rs.total_simulations_received = 3
        rs.simulations_clicked = 3  # 100% → +30 → score=80
        rs.recalculate_score()
        self.assertTrue(rs.requires_remediation)

    def test_requires_remediation_flag_clear_at_or_below_70(self):
        rs = self._fresh_score()
        # default score 50, no activity
        rs.recalculate_score()
        self.assertFalse(rs.requires_remediation)
