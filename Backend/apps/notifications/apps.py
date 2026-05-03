"""
Notifications app configuration.
Registers the 'notifications' Django app with its verbose name.
Part of the 'notifications' app.
"""
from django.apps import AppConfig


class NotificationsConfig(AppConfig):
    """AppConfig for the notifications app."""

    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.notifications'
    verbose_name = 'Notifications'
