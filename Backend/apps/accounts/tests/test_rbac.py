"""
Unit tests for RBAC permission classes in apps/core/permissions.py.
Uses lightweight mock request objects to avoid HTTP overhead.
"""
from unittest.mock import MagicMock

from django.test import TestCase

from apps.companies.models import Company
from apps.core.permissions import (
    IsSuperAdmin,
    IsCompanyAdmin,
    IsSameCompany,
)
from django.contrib.auth import get_user_model

User = get_user_model()


def _make_request(user):
    """Return a minimal mock request with the given user."""
    req = MagicMock()
    req.user = user
    return req


class IsSuperAdminPermissionTest(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.company = Company.objects.create(name="RBAC Test Corp")
        cls.super_admin = User.objects.create_user(
            email="sa@phishaware.sa", password="pass", role="SUPER_ADMIN", is_verified=True
        )
        cls.company_admin = User.objects.create_user(
            email="ca@company.sa", password="pass", role="COMPANY_ADMIN",
            company=cls.company, is_verified=True
        )
        cls.employee = User.objects.create_user(
            email="emp@company.sa", password="pass", role="EMPLOYEE",
            company=cls.company, is_verified=True
        )

    def setUp(self):
        self.perm = IsSuperAdmin()

    def test_grants_super_admin(self):
        self.assertTrue(self.perm.has_permission(_make_request(self.super_admin), None))

    def test_denies_company_admin(self):
        self.assertFalse(self.perm.has_permission(_make_request(self.company_admin), None))

    def test_denies_employee(self):
        self.assertFalse(self.perm.has_permission(_make_request(self.employee), None))

    def test_denies_anonymous(self):
        anon = MagicMock()
        anon.is_authenticated = False
        req = MagicMock()
        req.user = anon
        self.assertFalse(self.perm.has_permission(req, None))


class IsCompanyAdminPermissionTest(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.company = Company.objects.create(name="RBAC CompanyAdmin Corp")
        cls.company_admin = User.objects.create_user(
            email="ca2@company.sa", password="pass", role="COMPANY_ADMIN",
            company=cls.company, is_verified=True
        )
        cls.employee = User.objects.create_user(
            email="emp2@company.sa", password="pass", role="EMPLOYEE",
            company=cls.company, is_verified=True
        )

    def setUp(self):
        self.perm = IsCompanyAdmin()

    def test_grants_company_admin(self):
        self.assertTrue(self.perm.has_permission(_make_request(self.company_admin), None))

    def test_denies_employee(self):
        self.assertFalse(self.perm.has_permission(_make_request(self.employee), None))


class IsSameCompanyPermissionTest(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.company_a = Company.objects.create(name="Same Company A")
        cls.company_b = Company.objects.create(name="Same Company B")
        cls.admin_a = User.objects.create_user(
            email="admin_a@comp-a.sa", password="pass", role="COMPANY_ADMIN",
            company=cls.company_a, is_verified=True
        )
        cls.admin_b = User.objects.create_user(
            email="admin_b@comp-b.sa", password="pass", role="COMPANY_ADMIN",
            company=cls.company_b, is_verified=True
        )
        cls.super_admin = User.objects.create_user(
            email="sa@phishaware2.sa", password="pass", role="SUPER_ADMIN", is_verified=True
        )

    def setUp(self):
        self.perm = IsSameCompany()

    def _obj_with_company(self, company):
        obj = MagicMock()
        obj.company = company
        return obj

    def test_same_company_allowed(self):
        obj = self._obj_with_company(self.company_a)
        self.assertTrue(
            self.perm.has_object_permission(_make_request(self.admin_a), None, obj)
        )

    def test_cross_company_denied(self):
        obj = self._obj_with_company(self.company_a)
        self.assertFalse(
            self.perm.has_object_permission(_make_request(self.admin_b), None, obj)
        )

    def test_super_admin_can_access_any_company(self):
        obj = self._obj_with_company(self.company_a)
        self.assertTrue(
            self.perm.has_object_permission(_make_request(self.super_admin), None, obj)
        )
