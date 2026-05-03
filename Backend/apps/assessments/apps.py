"""
Assessments app configuration.
Registers the 'assessments' Django app for email template management and AI generation.
Part of the 'assessments' app.
"""
from django.apps import AppConfig


class AssessmentsConfig(AppConfig):
    """AppConfig for the assessments app."""

    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.assessments'
    verbose_name = 'Risk Scoring & Training'
