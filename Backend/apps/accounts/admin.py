"""
Accounts admin configuration.
Registers the custom User model in the Django admin site with tailored fieldsets,
search fields, and list displays for platform operators.
Part of the 'accounts' app.
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin configuration for the custom User model, extending Django's built-in UserAdmin."""

    # Columns shown in the changelist table
    list_display = ['email', 'first_name', 'last_name', 'role', 'company', 'is_active', 'date_joined']
    # Sidebar filters available on the changelist
    list_filter = ['role', 'is_active', 'is_staff', 'is_superuser', 'date_joined']
    # Fields that the admin search bar queries
    search_fields = ['email', 'first_name', 'last_name', 'phone_number']
    ordering = ['-date_joined']
    # These fields are system-managed and must not be editable in the admin
    readonly_fields = ['date_joined', 'last_login', 'updated_at']

    # Fieldsets for the user edit/detail page, grouped by concern
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        (_('Personal Info'), {'fields': ('first_name', 'last_name', 'phone_number', 'preferred_language')}),
        (_('Role & Company'), {'fields': ('role', 'company')}),
        (_('Permissions'), {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'is_verified', 'groups', 'user_permissions'),
        }),
        (_('Important Dates'), {'fields': ('last_login', 'date_joined', 'updated_at')}),
    )

    # Fieldsets for the "Add user" admin page
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'first_name', 'last_name', 'role', 'company'),
        }),
    )

    # Render groups and user_permissions as dual-pane multi-select widgets
    filter_horizontal = ('groups', 'user_permissions',)
