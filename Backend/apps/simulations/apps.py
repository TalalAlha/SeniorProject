"""
Simulations app configuration.
Registers the 'simulations' Django application for phishing simulation campaigns.
Part of the 'simulations' app.
"""

from django.apps import AppConfig


class SimulationsConfig(AppConfig):
    """AppConfig for the simulations app."""

    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.simulations'
    verbose_name = 'Live Simulation Attacks'
