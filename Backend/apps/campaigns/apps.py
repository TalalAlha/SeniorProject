"""
Campaigns app configuration.
Registers the 'campaigns' Django app for quiz-based phishing-awareness campaigns.
Part of the 'campaigns' app.
"""
from django.apps import AppConfig


class CampaignsConfig(AppConfig):
    """AppConfig for the campaigns app."""

    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.campaigns'
    verbose_name = 'Quiz Campaigns'
