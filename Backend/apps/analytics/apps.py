"""
Analytics app configuration.
Registers the 'analytics' Django app which provides platform-wide and per-company
reporting aggregated from simulation, training, and campaign data.
Part of the 'analytics' app.
"""
from django.apps import AppConfig


class AnalyticsConfig(AppConfig):
    """AppConfig for the analytics and reporting app."""

    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.analytics'
    verbose_name = 'Analytics & Reporting'
