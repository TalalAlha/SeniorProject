"""
Training app configuration.
Registers the 'training' Django app and wires up the post_save signals
that update risk scores whenever a TrackingEvent is recorded.
Part of the 'training' app.
"""
from django.apps import AppConfig


class TrainingConfig(AppConfig):
    """AppConfig for the training and risk-scoring app."""

    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.training'
    verbose_name = 'Risk Scoring & Remediation Training'

    def ready(self):
        """Connect signals on app startup."""
        # Import signals when app is ready
        import apps.training.signals  # noqa: F401
