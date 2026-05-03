"""
Gamification Views
==================
API views for badges, points, and leaderboards.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.db import transaction

from .models import Badge, EmployeeBadge, PointsTransaction, EmployeePoints
from .serializers import (
    BadgeListSerializer,
    BadgeDetailSerializer,
    BadgeCreateSerializer,
    EmployeeBadgeSerializer,
    EmployeeBadgeListSerializer,
    PointsTransactionSerializer,
    EmployeePointsSerializer,
    AdminPointsAdjustmentSerializer,
    BulkBadgeAwardSerializer,
    LeaderboardEntrySerializer,
)
from .services import (
    get_or_create_employee_points,
    award_points,
    check_and_award_badge,
    get_leaderboard,
    get_employee_rank,
)
from apps.core.permissions import (
    IsSuperAdminOrCompanyAdmin,
    HasCompanyAccess,
)


# ============================================================================
# Badge ViewSet
# ============================================================================

class BadgeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Badge CRUD operations.

    - Anyone authenticated can list available badges
    - Only admins can create/update/delete badges
    """

    queryset = Badge.objects.all()
    permission_classes = [IsAuthenticated, HasCompanyAccess]

    def get_serializer_class(self):
        """Return the appropriate serializer based on the current action."""
        # Write actions use a leaner serializer that exposes all editable fields
        if self.action in ['create', 'update', 'partial_update']:
            return BadgeCreateSerializer
        elif self.action == 'retrieve':
            # Detail view includes times_awarded count via SerializerMethodField
            return BadgeDetailSerializer
        return BadgeListSerializer

    def get_queryset(self):
        """Filter badges by company visibility and user role."""
        user = self.request.user

        if user.is_super_admin:
            # Super admins see all badges across all companies
            queryset = Badge.objects.all()
        else:
            # Regular users see global badges (company=None) plus their company's custom badges
            queryset = Badge.objects.filter(
                Q(company__isnull=True) | Q(company=user.company)
            )

        # Apply filters
        if not user.is_super_admin and not user.is_company_admin:
            # Employees don't see hidden badges they haven't earned
            earned_badge_ids = EmployeeBadge.objects.filter(
                employee=user
            ).values_list('badge_id', flat=True)
            # Hidden badges become visible once the employee has earned them
            queryset = queryset.filter(
                Q(is_hidden=False) | Q(id__in=earned_badge_ids)
            )

        # Always exclude deactivated badges from the public-facing queryset
        queryset = queryset.filter(is_active=True)
        return queryset

    def get_permissions(self):
        """Restrict mutating actions to admins; allow read access to all authenticated users."""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsSuperAdminOrCompanyAdmin()]
        return [IsAuthenticated(), HasCompanyAccess()]

    @action(detail=False, methods=['get'])
    def my_badges(self, request):
        """Get current user's earned badges."""
        badges = EmployeeBadge.objects.filter(
            employee=request.user
        ).select_related('badge').order_by('-awarded_at')

        serializer = EmployeeBadgeSerializer(badges, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Get recently awarded badges (company-wide)."""
        user = request.user

        if user.is_super_admin:
            company_id = request.query_params.get('company')
            if company_id:
                queryset = EmployeeBadge.objects.filter(company_id=company_id)
            else:
                queryset = EmployeeBadge.objects.all()
        else:
            queryset = EmployeeBadge.objects.filter(company=user.company)

        queryset = queryset.select_related('badge', 'employee').order_by('-awarded_at')[:20]
        serializer = EmployeeBadgeSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsSuperAdminOrCompanyAdmin])
    @transaction.atomic
    def bulk_award(self, request, pk=None):
        """Award a badge to multiple employees."""
        # pk resolves to the Badge the action is nested under
        badge = self.get_object()
        serializer = BulkBadgeAwardSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        employee_ids = serializer.validated_data['employee_ids']

        from apps.accounts.models import User

        # Scope to the requesting admin's company unless they are a super admin
        if not request.user.is_super_admin:
            employees = User.objects.filter(
                id__in=employee_ids,
                role='EMPLOYEE',
                company=request.user.company  # prevent cross-company awards
            )
        else:
            employees = User.objects.filter(id__in=employee_ids, role='EMPLOYEE')

        # check_and_award_badge returns None if the employee already has the badge
        awarded = []
        skipped = []

        for employee in employees:
            emp_badge = check_and_award_badge(
                employee=employee,
                badge_type=badge.badge_type,
                source_type='AdminAward',
                source_id=request.user.id  # track which admin triggered the award
            )
            if emp_badge:
                awarded.append(employee.email)
            else:
                # Already had the badge or badge is inactive — skip silently
                skipped.append(employee.email)

        return Response({
            'awarded': len(awarded),
            'skipped': len(skipped),
            'awarded_to': awarded,
            'skipped_emails': skipped
        })


# ============================================================================
# Points ViewSet
# ============================================================================

class PointsViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for points and transactions.

    - Employees can see their own points
    - Admins can see company-wide points
    """

    queryset = EmployeePoints.objects.all()
    permission_classes = [IsAuthenticated, HasCompanyAccess]
    serializer_class = EmployeePointsSerializer

    def get_queryset(self):
        """Scope the queryset to what the requesting user is allowed to see."""
        user = self.request.user

        if user.is_super_admin:
            # Super admins can inspect all records
            queryset = EmployeePoints.objects.all()
        elif user.is_company_admin:
            # Company admins see their whole company's leaderboard data
            queryset = EmployeePoints.objects.filter(company=user.company)
        else:
            # Regular employees only see their own points record
            queryset = EmployeePoints.objects.filter(employee=user)

        # select_related avoids N+1 queries when serializing employee/company fields
        return queryset.select_related('employee', 'company')

    @action(detail=False, methods=['get'])
    def my_summary(self, request):
        """Get current user's points summary."""
        # get_or_create ensures a record exists even for brand-new employees
        emp_points, _ = get_or_create_employee_points(request.user)

        if not emp_points:
            # Employee has no company assigned; return a safe zero-state response
            return Response({
                'total_points': 0,
                'weekly_points': 0,
                'monthly_points': 0,
                'badge_count': 0,
                'rank_all_time': None,
                'rank_weekly': None,
                'rank_monthly': None,
                'current_streak_days': 0,
                'longest_streak_days': 0,
            })

        return Response({
            'total_points': emp_points.total_points,
            'weekly_points': emp_points.weekly_points,
            'monthly_points': emp_points.monthly_points,
            'badge_count': emp_points.badge_count,
            # Rank is computed on-the-fly by counting employees with higher points
            'rank_all_time': get_employee_rank(request.user, 'all_time'),
            'rank_weekly': get_employee_rank(request.user, 'weekly'),
            'rank_monthly': get_employee_rank(request.user, 'monthly'),
            'current_streak_days': emp_points.current_streak_days,
            'longest_streak_days': emp_points.longest_streak_days,
        })

    @action(detail=False, methods=['get'])
    def my_transactions(self, request):
        """Get current user's points transaction history."""
        transactions = PointsTransaction.objects.filter(
            employee=request.user
        ).order_by('-created_at')

        # Paginate
        page = self.paginate_queryset(transactions)
        if page is not None:
            serializer = PointsTransactionSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = PointsTransactionSerializer(transactions, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated, IsSuperAdminOrCompanyAdmin])
    @transaction.atomic
    def adjust(self, request):
        """Admin manual points adjustment."""
        serializer = AdminPointsAdjustmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        from apps.accounts.models import User

        employee_id = serializer.validated_data['employee_id']
        points = serializer.validated_data['points']  # may be negative for deductions
        description = serializer.validated_data['description']
        description_ar = serializer.validated_data.get('description_ar', '')

        # 404 if employee doesn't exist or is not an EMPLOYEE-role user
        employee = get_object_or_404(User, id=employee_id, role='EMPLOYEE')

        # Enforce company boundary — company admins cannot touch other companies' employees
        if not request.user.is_super_admin and employee.company != request.user.company:
            return Response(
                {'error': 'You can only adjust points for your company employees'},
                status=status.HTTP_403_FORBIDDEN
            )

        # award_points handles aggregate updates and transaction creation atomically
        pt = award_points(
            employee=employee,
            transaction_type='ADMIN_ADJUSTMENT',
            points=points,
            source_type='AdminAdjustment',
            source_id=request.user.id,  # record which admin made the adjustment
            description=description
        )

        if pt:
            # Save Arabic description in a separate update to avoid re-triggering any signals
            pt.description_ar = description_ar
            pt.save(update_fields=['description_ar'])

        return Response({
            'success': True,
            'employee': employee.email,
            'points_adjusted': points,
            'new_balance': pt.balance_after if pt else 0
        })


# ============================================================================
# Leaderboard ViewSet
# ============================================================================

class LeaderboardViewSet(viewsets.ViewSet):
    """
    ViewSet for leaderboard queries.

    Supports:
    - Company-wide leaderboards
    - Time-based periods (weekly, monthly, all-time)
    """

    permission_classes = [IsAuthenticated, HasCompanyAccess]

    def list(self, request):
        """
        Get leaderboard.

        Query params:
        - period: 'weekly', 'monthly', 'all_time' (default)
        - company: Company ID (super admin only)
        - limit: Number of entries (default 10, max 100)
        - offset: Pagination offset
        """
        user = request.user
        period = request.query_params.get('period', 'all_time')
        limit = min(int(request.query_params.get('limit', 10)), 100)
        offset = int(request.query_params.get('offset', 0))

        # Super admins may pass an explicit company_id; others are scoped to their own company
        if user.is_super_admin:
            company_id = request.query_params.get('company')
            if company_id:
                company_id = int(company_id)
        else:
            company_id = user.company_id

        # Retrieve paginated EmployeePoints rows ordered by the chosen period field
        entries = get_leaderboard(
            company_id=company_id,
            period=period,
            limit=limit,
            offset=offset
        )

        # Add rank, period-correct points, and is_current_user to each entry
        entries_with_rank = []
        for idx, entry in enumerate(entries):
            entry_data = LeaderboardEntrySerializer(entry).data
            # Rank is 1-based and respects the offset for pagination
            entry_data['rank'] = offset + idx + 1

            # Resolve points for the requested period — the model stores all three periods
            if period == 'weekly':
                entry_data['points'] = entry.weekly_points
            elif period == 'monthly':
                entry_data['points'] = entry.monthly_points
            else:
                # Default to all-time total
                entry_data['points'] = entry.total_points

            # Let the frontend highlight the current user's row without a separate API call
            entry_data['is_current_user'] = (entry.employee_id == user.id)

            entries_with_rank.append(entry_data)

        # Admins don't participate in the employee leaderboard; rank is None for them
        my_rank = get_employee_rank(user, period) if user.role == 'EMPLOYEE' else None
        try:
            my_points_obj = EmployeePoints.objects.get(employee=user)
            # Pick the correct period-specific counter to match what the leaderboard shows
            if period == 'weekly':
                my_points = my_points_obj.weekly_points
            elif period == 'monthly':
                my_points = my_points_obj.monthly_points
            else:
                my_points = my_points_obj.total_points
        except EmployeePoints.DoesNotExist:
            # User has never earned points — return 0 rather than error
            my_points = 0

        # Resolve a human-readable company name for the response header
        company_name = None
        if company_id:
            from apps.companies.models import Company
            try:
                company_name = Company.objects.get(id=company_id).name
            except Company.DoesNotExist:
                pass

        # Total participants = all EmployeePoints rows for the company (or global)
        total_query = EmployeePoints.objects.all()
        if company_id:
            total_query = total_query.filter(company_id=company_id)
        total_participants = total_query.count()

        return Response({
            'period': period,
            'company_id': company_id,
            'company_name': company_name,
            'total_participants': total_participants,
            'entries': entries_with_rank,
            'my_rank': my_rank,
            # my_points is null for admins who aren't tracked on the leaderboard
            'my_points': my_points if user.role == 'EMPLOYEE' else None,
        })

    @action(detail=False, methods=['get'])
    def my_position(self, request):
        """Get current user's position in leaderboard."""
        user = request.user

        # Admins are excluded from employee-facing leaderboards
        if user.role != 'EMPLOYEE':
            return Response({'error': 'Only employees have leaderboard positions'}, status=400)

        # Use .first() instead of .get() to avoid DoesNotExist exceptions for new employees
        emp_points = EmployeePoints.objects.filter(employee=user).first()

        # Count all employees in the same company to show "rank X of Y" context
        total_participants = EmployeePoints.objects.filter(
            company=user.company
        ).count() if user.company else 0

        return Response({
            'all_time': {
                'rank': get_employee_rank(user, 'all_time'),
                'points': emp_points.total_points if emp_points else 0,
                'total': total_participants,
            },
            'monthly': {
                'rank': get_employee_rank(user, 'monthly'),
                'points': emp_points.monthly_points if emp_points else 0,
                'total': total_participants,
            },
            'weekly': {
                'rank': get_employee_rank(user, 'weekly'),
                'points': emp_points.weekly_points if emp_points else 0,
                'total': total_participants,
            },
        })
