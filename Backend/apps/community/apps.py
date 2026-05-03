"""
Community app configuration.
Registers the community app with Django and sets display metadata.
Part of the 'community' app.
"""

from django.apps import AppConfig


class CommunityConfig(AppConfig):
    """AppConfig for the community awareness portal app."""

    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.community'
    verbose_name = 'Community Portal'
