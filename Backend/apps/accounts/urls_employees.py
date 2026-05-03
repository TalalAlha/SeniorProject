"""
Employee invitation URL routes.
Defines all endpoints for the employee invitation lifecycle: send, inspect, accept,
list pending, resend, and cancel. Mounted at: /api/v1/employees/
Part of the 'accounts' app.
"""
from django.urls import path

from .views import (
    InviteEmployeeView,
    GetInvitationDetailsView,
    AcceptInvitationView,
    ListPendingInvitationsView,
    ResendInvitationView,
    CancelInvitationView,
)

urlpatterns = [
    # POST — company admin sends an invitation email to a new employee address
    path('invite/', InviteEmployeeView.as_view(), name='employee_invite'),
    # GET — returns invitation metadata (email, names, company) for the accept-invitation page
    path('invite/<uuid:token>/', GetInvitationDetailsView.as_view(), name='invitation_details'),
    # POST — employee sets a password and activates their account using the UUID token
    path('invite/<uuid:token>/accept/', AcceptInvitationView.as_view(), name='accept_invitation'),

    # --- Pending invitation management (company admin only) ---
    # GET — lists all PENDING invitations belonging to the admin's company
    path('pending/', ListPendingInvitationsView.as_view(), name='pending_invitations'),
    # POST — rotates the invitation token and resends the email to an existing pending user
    path('<int:user_id>/resend/', ResendInvitationView.as_view(), name='resend_invitation'),
    # DELETE — cancels the invitation and deletes the placeholder user record
    path('<int:user_id>/cancel/', CancelInvitationView.as_view(), name='cancel_invitation'),
]
