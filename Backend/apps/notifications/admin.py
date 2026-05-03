"""
Notifications admin configuration.
Registers the Notification model in the Django admin with filtering and search.
Part of the 'notifications' app.
"""
from django.contrib import admin
from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    """Admin view for Notification records with type/priority/read-state filters."""

    list_display = ['user', 'notification_type', 'title', 'priority', 'is_read', 'created_at']
    list_filter = ['notification_type', 'priority', 'is_read']
    search_fields = ['user__email', 'title', 'message']
    readonly_fields = ['created_at', 'read_at']
