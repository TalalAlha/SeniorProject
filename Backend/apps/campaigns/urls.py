"""
Campaigns URL configuration.
Registers CampaignViewSet and QuizViewSet under their respective router prefixes.
Mounted at api/v1/ by the root URL configuration.
Part of the 'campaigns' app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CampaignViewSet, QuizViewSet

app_name = 'campaigns'

router = DefaultRouter()
router.register(r'campaigns', CampaignViewSet, basename='campaign')
router.register(r'quizzes', QuizViewSet, basename='quiz')

urlpatterns = [
    path('', include(router.urls)),
]
