"""
Management command to seed a load-test employee for Locust.

Creates:
  - Company: "PhishAware Load Test Co"
  - User:    loadtest.employee@phishaware.com / LoadTest123!
             role=EMPLOYEE, is_verified=True

Usage:
  python manage.py seed_load_test_user
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.companies.models import Company

User = get_user_model()

COMPANY_NAME = "PhishAware Load Test Co"
EMPLOYEE_EMAIL = "loadtest.employee@phishaware.com"
EMPLOYEE_PASSWORD = "LoadTest123!"


class Command(BaseCommand):
    help = "Seed a verified load-test employee account for Locust performance tests."

    def handle(self, *args, **options):
        company, _ = Company.objects.get_or_create(name=COMPANY_NAME)

        if User.objects.filter(email=EMPLOYEE_EMAIL).exists():
            self.stdout.write(self.style.WARNING(
                f"Load test user {EMPLOYEE_EMAIL} already exists — skipping."
            ))
            return

        User.objects.create_user(
            email=EMPLOYEE_EMAIL,
            password=EMPLOYEE_PASSWORD,
            first_name="Load",
            last_name="Tester",
            role="EMPLOYEE",
            company=company,
            is_verified=True,
            is_active=True,
        )
        self.stdout.write(self.style.SUCCESS(
            f"Created load-test user: {EMPLOYEE_EMAIL} (company: {COMPANY_NAME})"
        ))
