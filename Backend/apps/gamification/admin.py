"""
Gamification admin configuration.
Registers Badge, EmployeeBadge, PointsTransaction, and EmployeePoints with the Django admin site.
Part of the 'gamification' app.
"""

from django.contrib import admin
from .models import Badge, EmployeeBadge, PointsTransaction, EmployeePoints


@admin.register(Badge)
class BadgeAdmin(admin.ModelAdmin):
    """Admin view for Badge model — list, filter, and edit badge definitions."""

    list_display = ['name', 'badge_type', 'rarity', 'points_awarded', 'is_active', 'is_hidden', 'company']
    # Filter sidebar allows narrowing by rarity, active state, visibility, and company
    list_filter = ['rarity', 'is_active', 'is_hidden', 'company']
    search_fields = ['name', 'name_ar', 'description']
    # Timestamps are auto-set and should not be editable
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        (None, {
            'fields': ('name', 'name_ar', 'badge_type', 'description', 'description_ar')
        }),
        ('Visual', {
            # Icon, color, and rarity control how the badge renders in the UI
            'fields': ('icon', 'color', 'rarity')
        }),
        ('Settings', {
            # criteria is a JSON blob used by services.check_and_award_badge
            'fields': ('points_awarded', 'criteria', 'is_active', 'is_hidden', 'company')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(EmployeeBadge)
class EmployeeBadgeAdmin(admin.ModelAdmin):
    """Admin view for EmployeeBadge — tracks individual badge awards per employee."""

    list_display = ['employee', 'badge', 'company', 'awarded_at', 'points_awarded', 'is_notified']
    # Allow filtering by badge type, company, notification status, and award date
    list_filter = ['badge', 'company', 'is_notified', 'awarded_at']
    search_fields = ['employee__email', 'employee__first_name', 'badge__name']
    # awarded_at is auto-set on create and must not be changed manually
    readonly_fields = ['awarded_at']
    # raw_id_fields replaces slow select widgets for FK fields with large tables
    raw_id_fields = ['employee', 'badge']
    date_hierarchy = 'awarded_at'


@admin.register(PointsTransaction)
class PointsTransactionAdmin(admin.ModelAdmin):
    """Admin view for PointsTransaction — the full audit trail of points earned or deducted."""

    list_display = ['employee', 'transaction_type', 'points', 'balance_after', 'created_at']
    list_filter = ['transaction_type', 'company', 'created_at']
    search_fields = ['employee__email', 'description']
    # balance_after and created_at are computed/auto-set; keep them read-only
    readonly_fields = ['created_at', 'balance_after']
    raw_id_fields = ['employee']
    date_hierarchy = 'created_at'


@admin.register(EmployeePoints)
class EmployeePointsAdmin(admin.ModelAdmin):
    """Admin view for EmployeePoints — aggregated totals used for leaderboard queries."""

    list_display = ['employee', 'company', 'total_points', 'weekly_points', 'monthly_points', 'badge_count']
    list_filter = ['company']
    search_fields = ['employee__email', 'employee__first_name']
    # Timestamps are managed automatically; raw_id for the large User table
    readonly_fields = ['created_at', 'updated_at']
    raw_id_fields = ['employee']
    fieldsets = (
        (None, {
            'fields': ('employee', 'company')
        }),
        ('Points', {
            # All four counters are updated atomically via F() expressions in services.award_points
            'fields': ('total_points', 'weekly_points', 'monthly_points', 'badge_count')
        }),
        ('Period Tracking', {
            # week_start and month_start let services.reset_period_points_if_needed detect rollovers
            'fields': ('week_start', 'month_start')
        }),
        ('Streak', {
            'fields': ('current_streak_days', 'longest_streak_days', 'last_activity_date')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
