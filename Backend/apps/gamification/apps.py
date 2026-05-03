"""
Gamification app configuration.
Declares the GamificationConfig AppConfig and connects signals on startup.
Part of the 'gamification' app.
"""

from django.apps import AppConfig


class GamificationConfig(AppConfig):
    """AppConfig for the gamification app — sets metadata and wires up signals."""

    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.gamification'
    verbose_name = 'Gamification & Rewards'

    def ready(self):
        """Import signal handlers so they are registered when Django starts."""
        # Importing the signals module here (not at top-level) avoids circular imports
        import apps.gamification.signals  # noqa: F401
