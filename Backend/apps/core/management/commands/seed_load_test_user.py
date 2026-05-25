"""
Management command to seed load-test users for Locust.

LOCAL DEVELOPMENT ONLY — DO NOT RUN IN PRODUCTION.
Creates accounts with a fixed, publicly-known password for performance testing.

Creates:
  - Company:       "PhishAware Load Test Co"
  - Employee user: loadtest.employee@phishaware.com / LoadTest123!
  - Admin user:    loadtest.admin@phishaware.com    / LoadTest123!
  - RiskScore record for the employee (so /risk-scores/my_score/ returns 200)

Usage:
  python manage.py seed_load_test_user
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

from apps.companies.models import Company
from apps.training.models import RiskScore

User = get_user_model()

COMPANY_NAME   = "PhishAware Load Test Co"
EMPLOYEE_EMAIL = "loadtest.employee@phishaware.com"
ADMIN_EMAIL    = "loadtest.admin@phishaware.com"
PASSWORD       = "LoadTest123!"


class Command(BaseCommand):
    help = "Seed verified load-test accounts (employee + admin) for Locust performance tests."

    def handle(self, *args, **options):
        company, _ = Company.objects.get_or_create(name=COMPANY_NAME)

        # --- Employee ---
        employee, emp_created = User.objects.get_or_create(
            email=EMPLOYEE_EMAIL,
            defaults={
                "first_name": "Load",
                "last_name": "Tester",
                "role": "EMPLOYEE",
                "company": company,
                "is_verified": True,
                "is_active": True,
            },
        )
        if emp_created:
            employee.set_password(PASSWORD)
            employee.save()
            self.stdout.write(self.style.SUCCESS(f"Created employee: {EMPLOYEE_EMAIL}"))
        else:
            self.stdout.write(self.style.WARNING(f"Employee already exists: {EMPLOYEE_EMAIL}"))

        # Ensure a RiskScore record exists so /risk-scores/my_score/ returns 200
        RiskScore.objects.get_or_create(
            employee=employee,
            defaults={"company": company, "score": 50},
        )

        # --- Admin ---
        admin, adm_created = User.objects.get_or_create(
            email=ADMIN_EMAIL,
            defaults={
                "first_name": "Load",
                "last_name": "Admin",
                "role": "COMPANY_ADMIN",
                "company": company,
                "is_verified": True,
                "is_active": True,
            },
        )
        if adm_created:
            admin.set_password(PASSWORD)
            admin.save()
            self.stdout.write(self.style.SUCCESS(f"Created admin:    {ADMIN_EMAIL}"))
        else:
            self.stdout.write(self.style.WARNING(f"Admin already exists:    {ADMIN_EMAIL}"))

        self.stdout.write(self.style.SUCCESS(
            f"\nDone. Company: '{COMPANY_NAME}' | Password for both: {PASSWORD}"
        ))
