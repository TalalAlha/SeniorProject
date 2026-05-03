"""
Notifications URL configuration.
Registers NotificationViewSet under a DefaultRouter; mounted at api/v1/notifications/.
Part of the 'notifications' app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NotificationViewSet

router = DefaultRouter()
router.register('', NotificationViewSet, basename='notification')

urlpatterns = [
    path('', include(router.urls)),
]
