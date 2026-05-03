"""
Accounts app configuration.
Registers the 'accounts' Django app with its verbose name and default primary key type.
Part of the 'accounts' app.
"""
from django.apps import AppConfig


class AccountsConfig(AppConfig):
    """Django app config for the accounts application."""

    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.accounts'
    verbose_name = 'User Accounts & Authentication'
