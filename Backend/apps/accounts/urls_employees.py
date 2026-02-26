"""
Employee invitation URL routes.
Mounted at: /api/v1/employees/
"""
from django.urls import path

from .views import InviteEmployeeView, GetInvitationDetailsView, AcceptInvitationView

urlpatterns = [
    path('invite/', InviteEmployeeView.as_view(), name='employee_invite'),
    path('invite/<uuid:token>/', GetInvitationDetailsView.as_view(), name='invitation_details'),
    path('invite/<uuid:token>/accept/', AcceptInvitationView.as_view(), name='accept_invitation'),
]
