"""
Notifications serializers.
Serializes Notification records for the REST API, adding a human-readable 'time_ago' field.
Part of the 'notifications' app.
"""
from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    """Read-only serializer for Notification including a computed time_ago string."""

    time_ago = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            'id',
            'notification_type',
            'title',
            'message',
            'priority',
            'link',
            'is_read',
            'created_at',
            'time_ago',
        ]
        read_only_fields = fields

    def get_time_ago(self, obj):
        """Return a human-readable relative time string, e.g. '3 minutes ago'."""
        from django.utils.timesince import timesince
        return timesince(obj.created_at) + ' ago'
