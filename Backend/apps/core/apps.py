"""
Core app configuration.
Registers the 'core' Django app which provides shared permissions, email helpers,
and password validators used across all other apps.
Part of the 'core' app.
"""
from django.apps import AppConfig


class CoreConfig(AppConfig):
    """AppConfig for the core utilities app."""

    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.core'
    verbose_name = 'Core Utilities'
