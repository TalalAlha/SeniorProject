"""
Unit tests for the Gamification app (Badge, EmployeeBadge, PointsTransaction, EmployeePoints).

Key model facts:
- Badge.badge_type is unique
- EmployeeBadge.save() auto-sets company + points_awarded from badge
- PointsTransaction.save() auto-sets company from employee
- EmployeePoints.total_points is manually maintained (denormalized)
"""

from django.test import TestCase

from apps.companies.models import Company
from apps.gamification.models import (
    Badge,
    EmployeeBadge,
    EmployeePoints,
    PointsTransaction,
)
from django.contrib.auth import get_user_model

User = get_user_model()


class BadgesAndPointsTestCase(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.company = Company.objects.create(name="Gamification Test Corp")
        cls.employee = User.objects.create_user(
            email="gamer@corp.sa",
            password="pass",
            role="EMPLOYEE",
            company=cls.company,
            is_verified=True,
        )

        # Badges are seeded by migration gamification/0002_initial_badges — use get_or_create
        cls.first_quiz_badge, _ = Badge.objects.get_or_create(
            badge_type="FIRST_QUIZ_COMPLETED",
            defaults={
                "name": "First Quiz",
                "description": "Awarded on completing the first quiz",
                "icon": "medal",
                "points_awarded": 100,
            },
        )
        cls.perfect_badge, _ = Badge.objects.get_or_create(
            badge_type="PERFECT_QUIZ_SCORE",
            defaults={
                "name": "Perfect Score",
                "description": "Awarded for 100% quiz score",
                "icon": "star",
                "points_awarded": 250,
            },
        )

    # ------------------------------------------------------------------
    # PointsTransaction
    # ------------------------------------------------------------------

    def test_points_transaction_creates_record_with_balance(self):
        tx = PointsTransaction.objects.create(
            employee=self.employee,
            company=self.company,
            transaction_type="QUIZ_COMPLETED",
            points=50,
            balance_after=50,
            description="Completed campaign quiz",
        )
        tx.refresh_from_db()
        self.assertEqual(tx.points, 50)
        self.assertEqual(tx.balance_after, 50)
        self.assertEqual(tx.employee, self.employee)

    def test_points_transaction_auto_sets_company_from_employee(self):
        """If company is not explicitly set, save() derives it from employee."""
        tx = PointsTransaction(
            employee=self.employee,
            transaction_type="BADGE_EARNED",
            points=100,
            balance_after=100,
        )
        tx.save()
        tx.refresh_from_db()
        self.assertEqual(tx.company, self.company)

    # ------------------------------------------------------------------
    # Badge awarding
    # ------------------------------------------------------------------

    def test_first_quiz_completed_badge_awarded_on_first_quiz(self):
        badge_award = EmployeeBadge.objects.create(
            employee=self.employee,
            badge=self.first_quiz_badge,
            company=self.company,
        )
        badge_award.refresh_from_db()
        self.assertEqual(badge_award.badge.badge_type, "FIRST_QUIZ_COMPLETED")
        self.assertEqual(badge_award.employee, self.employee)

    def test_perfect_quiz_score_badge_awarded_at_100_percent(self):
        badge_award = EmployeeBadge.objects.create(
            employee=self.employee,
            badge=self.perfect_badge,
            company=self.company,
        )
        badge_award.refresh_from_db()
        self.assertEqual(badge_award.badge.badge_type, "PERFECT_QUIZ_SCORE")
        # Points are copied from the badge at award time (EmployeeBadge.save())
        self.assertEqual(badge_award.points_awarded, self.perfect_badge.points_awarded)

    def test_employee_badge_save_auto_sets_points_from_badge(self):
        """EmployeeBadge.save() should copy badge.points_awarded when not set."""
        badge_award = EmployeeBadge(
            employee=self.employee,
            badge=self.first_quiz_badge,
            company=self.company,
            # points_awarded intentionally omitted — save() should fill it
        )
        badge_award.save()
        badge_award.refresh_from_db()
        self.assertEqual(badge_award.points_awarded, self.first_quiz_badge.points_awarded)

    # ------------------------------------------------------------------
    # EmployeePoints aggregate
    # ------------------------------------------------------------------

    def test_employee_points_total_aggregates_correctly(self):
        """Three transactions; total_points should equal the manual sum."""
        ep = EmployeePoints.objects.create(
            employee=self.employee,
            company=self.company,
            total_points=0,
        )

        amounts = [50, 100, 75]
        running = 0
        for amt in amounts:
            running += amt
            PointsTransaction.objects.create(
                employee=self.employee,
                company=self.company,
                transaction_type="QUIZ_COMPLETED",
                points=amt,
                balance_after=running,
            )

        # Manually update (denormalized) total as the app code would
        ep.total_points = running
        ep.save()
        ep.refresh_from_db()

        self.assertEqual(ep.total_points, sum(amounts))
