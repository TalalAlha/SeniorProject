"""
Unit tests for the Company model.

Key model facts:
- Company.name is unique
- Company.total_users counts all users via reverse FK 'users'
- Company.total_employees counts users with role='EMPLOYEE'
- Company.total_admins counts users with role='COMPANY_ADMIN'
- Company.is_subscription_active checks subscription_end_date >= today
"""

import datetime

from django.test import TestCase
from django.utils import timezone

from apps.companies.models import Company
from django.contrib.auth import get_user_model

User = get_user_model()


class CompanyModelTestCase(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.company = Company.objects.create(
            name="Model Test Corp",
            industry="TECH",
            company_size="51-200",
        )
        cls.admin = User.objects.create_user(
            email="co_model_admin@corp.sa",
            password="pass",
            role="COMPANY_ADMIN",
            company=cls.company,
            is_verified=True,
        )
        cls.employee1 = User.objects.create_user(
            email="co_model_emp1@corp.sa",
            password="pass",
            role="EMPLOYEE",
            company=cls.company,
            is_verified=True,
        )
        cls.employee2 = User.objects.create_user(
            email="co_model_emp2@corp.sa",
            password="pass",
            role="EMPLOYEE",
            company=cls.company,
            is_verified=True,
        )

    # ------------------------------------------------------------------
    # str
    # ------------------------------------------------------------------

    def test_company_str_returns_name(self):
        self.assertEqual(str(self.company), "Model Test Corp")

    # ------------------------------------------------------------------
    # User counts
    # ------------------------------------------------------------------

    def test_total_employees_counts_only_employees(self):
        self.assertEqual(self.company.total_employees, 2)

    def test_total_admins_counts_only_company_admins(self):
        self.assertEqual(self.company.total_admins, 1)

    def test_total_users_counts_all_roles(self):
        self.assertEqual(self.company.total_users, 3)

    # ------------------------------------------------------------------
    # is_subscription_active
    # ------------------------------------------------------------------

    def test_subscription_active_when_end_date_in_future(self):
        company = Company.objects.create(
            name="Sub Active Corp",
            subscription_end_date=timezone.now().date() + datetime.timedelta(days=30),
        )
        self.assertTrue(company.is_subscription_active)

    def test_subscription_inactive_when_no_end_date(self):
        company = Company.objects.create(name="No Sub Corp")
        self.assertFalse(company.is_subscription_active)

    def test_subscription_inactive_when_end_date_in_past(self):
        company = Company.objects.create(
            name="Expired Sub Corp",
            subscription_end_date=timezone.now().date() - datetime.timedelta(days=1),
        )
        self.assertFalse(company.is_subscription_active)

    # ------------------------------------------------------------------
    # Unique name constraint
    # ------------------------------------------------------------------

    def test_company_name_is_unique(self):
        from django.db import IntegrityError
        with self.assertRaises(IntegrityError):
            Company.objects.create(name="Model Test Corp")
