"""
Companies app configuration.
Registers the 'companies' Django app for organisation management.
Part of the 'companies' app.
"""
from django.apps import AppConfig


class CompaniesConfig(AppConfig):
    """AppConfig for the companies app."""

    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.companies'
    verbose_name = 'Company Management'
