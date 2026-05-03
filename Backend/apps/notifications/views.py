"""
Notifications views.
Provides read-only access to the current user's notifications plus actions to mark as read
or delete them.  All write operations are performed by NotificationService, not end-users.
Part of the 'notifications' app.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone

from .models import Notification
from .serializers import NotificationSerializer


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """ReadOnlyModelViewSet exposing list/retrieve plus custom mark-read and clear actions."""

    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return only notifications belonging to the authenticated user."""
        return Notification.objects.filter(user=self.request.user)

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Return the number of unread notifications for the current user."""
        count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({'count': count})

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark a single notification as read and record the timestamp."""
        notification = self.get_object()
        notification.is_read = True
        notification.read_at = timezone.now()
        # Use update_fields to avoid touching other columns and bypass any signal overhead
        notification.save(update_fields=['is_read', 'read_at'])
        return Response({'status': 'marked as read'})

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Bulk-update all unread notifications for the current user to read."""
        Notification.objects.filter(user=request.user, is_read=False).update(
            is_read=True,
            read_at=timezone.now(),
        )
        return Response({'status': 'all marked as read'})

    @action(detail=False, methods=['delete'])
    def clear_all(self, request):
        """Permanently delete all notifications for the current user."""
        Notification.objects.filter(user=request.user).delete()
        return Response({'status': 'all cleared'})
