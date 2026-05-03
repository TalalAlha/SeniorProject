"""
Campaigns views.
Provides CampaignViewSet and QuizViewSet for managing quiz campaigns and
employee quiz sessions, including AI email generation, quiz assignment,
answer submission, and result calculation.
Part of the 'campaigns' app.
"""

from rest_framework import viewsets, status, views
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Q
from django.db import transaction
import random
import logging

logger = logging.getLogger(__name__)

from .models import Campaign, Quiz, QuizResult
from apps.assessments.models import EmailTemplate, QuizQuestion
from .serializers import (
    CampaignListSerializer,
    CampaignDetailSerializer,
    CampaignCreateSerializer,
    QuizSerializer,
    QuizQuestionSimpleSerializer,
    QuizQuestionDetailSerializer,
    QuizResultSerializer,
    AnswerQuestionSerializer
)
from apps.core.permissions import (
    IsSuperAdminOrCompanyAdmin,
    HasCompanyAccess,
    IsEmployee
)


class CampaignViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Campaign CRUD operations.

    - Super Admins and Company Admins can create, update, delete campaigns
    - Employees can only view campaigns for their company
    """

    queryset = Campaign.objects.all()
    permission_classes = [IsAuthenticated, HasCompanyAccess]

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'create' or self.action == 'update':
            return CampaignCreateSerializer
        elif self.action == 'retrieve':
            return CampaignDetailSerializer
        return CampaignListSerializer

    def get_queryset(self):
        """Filter campaigns based on user role.

        Pre-joins company + created_by; serializers walk these FKs.
        """
        user = self.request.user
        base = Campaign.objects.select_related('company', 'created_by')

        if user.is_super_admin:
            return base.all()

        # Company admins and employees see only their company's campaigns
        if user.has_company_access:
            return base.filter(company=user.company)

        return Campaign.objects.none()

    def get_permissions(self):
        """Set permissions based on action."""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsSuperAdminOrCompanyAdmin()]
        return [IsAuthenticated(), HasCompanyAccess()]

    def perform_create(self, serializer):
        """Create campaign and auto-generate AI email templates."""
        # Save campaign first so it has a PK before passing it to the generator
        campaign = serializer.save()

        try:
            # ml_models is an optional package; import deferred to avoid startup errors
            from ml_models import generate_campaign_emails

            templates = generate_campaign_emails(
                campaign=campaign,
                num_phishing=campaign.num_phishing_emails,
                num_legitimate=campaign.num_legitimate_emails,
            )
            logger.info(
                "Generated %d AI email templates for campaign '%s'",
                len(templates), campaign.name,
            )
        except Exception as e:
            # Non-fatal: campaign is created without templates; admin can add manually
            logger.error(
                "AI email generation failed for campaign '%s': %s",
                campaign.name, e,
            )

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsSuperAdminOrCompanyAdmin])
    def activate(self, request, pk=None):
        """Activate a campaign and set it to active status."""
        campaign = self.get_object()

        # Prevent double-activation
        if campaign.status == 'ACTIVE':
            return Response(
                {'error': 'Campaign is already active'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Ensure the email pool is fully populated before going live
        total_emails = campaign.email_templates.count()
        if total_emails < campaign.num_emails:
            return Response(
                {'error': f'Campaign needs {campaign.num_emails} emails but only has {total_emails}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        campaign.status = 'ACTIVE'
        # Record the actual activation time if no explicit start_date was set
        if not campaign.start_date:
            campaign.start_date = timezone.now()
        campaign.save()

        return Response(
            CampaignDetailSerializer(campaign).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsSuperAdminOrCompanyAdmin])
    def assign_to_employees(self, request, pk=None):
        """Assign campaign to employees by creating quiz instances."""
        campaign = self.get_object()
        # Expect a JSON array of User PKs in the request body
        employee_ids = request.data.get('employee_ids', [])

        if not employee_ids:
            return Response(
                {'error': 'employee_ids list is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Accumulate successes and per-employee error messages separately
        created_quizzes = []
        errors = []

        for employee_id in employee_ids:
            try:
                from django.contrib.auth import get_user_model
                User = get_user_model()
                # Scoped lookup: only employees belonging to this campaign's company
                employee = User.objects.get(id=employee_id, role='EMPLOYEE', company=campaign.company)

                # Idempotent: skip if a quiz already exists for this (campaign, employee) pair
                quiz, created = Quiz.objects.get_or_create(
                    campaign=campaign,
                    employee=employee
                )

                if created:
                    # Populate the quiz with a randomized question set from the email pool
                    self._generate_quiz_questions(quiz)
                    created_quizzes.append(QuizSerializer(quiz).data)
                else:
                    errors.append(f"Quiz already exists for employee {employee.email}")

            except Exception as e:
                errors.append(f"Error creating quiz for employee {employee_id}: {str(e)}")

        # Refresh denormalized participant count from the database
        campaign.total_participants = campaign.quizzes.count()

        # Auto-activate campaign when first employees are assigned so quizzes become accessible
        if campaign.status == 'DRAFT' and created_quizzes:
            campaign.status = 'ACTIVE'
            if not campaign.start_date:
                campaign.start_date = timezone.now()

        campaign.save()

        return Response({
            'created_quizzes': created_quizzes,
            'errors': errors,
            'total_created': len(created_quizzes)
        }, status=status.HTTP_201_CREATED)

    def _generate_quiz_questions(self, quiz):
        """Generate randomized questions for a quiz from campaign's email pool."""
        campaign = quiz.campaign

        # Fetch each type separately so we can enforce the phishing_ratio split
        phishing_emails = list(campaign.email_templates.filter(email_type='PHISHING'))
        legitimate_emails = list(campaign.email_templates.filter(email_type='LEGITIMATE'))

        # Shuffle in-place so every employee gets a different ordering
        random.shuffle(phishing_emails)
        random.shuffle(legitimate_emails)

        # Slice to the exact counts derived from num_emails and phishing_ratio
        selected_phishing = phishing_emails[:campaign.num_phishing_emails]
        selected_legitimate = legitimate_emails[:campaign.num_legitimate_emails]

        # Interleave phishing and legitimate emails randomly to prevent positional bias
        all_emails = selected_phishing + selected_legitimate
        random.shuffle(all_emails)

        # Persist each email as an ordered QuizQuestion; question_number starts at 1
        for index, email_template in enumerate(all_emails, start=1):
            QuizQuestion.objects.create(
                quiz=quiz,
                email_template=email_template,
                question_number=index
            )

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated, HasCompanyAccess])
    def statistics(self, request, pk=None):
        """Get detailed statistics for a campaign."""
        campaign = self.get_object()

        stats = {
            'campaign_id': campaign.id,
            'campaign_name': campaign.name,
            'status': campaign.status,
            'total_participants': campaign.total_participants,
            'completed_participants': campaign.completed_participants,
            'completion_rate': float(campaign.completion_rate),
            'average_score': float(campaign.average_score) if campaign.average_score else None,
            'total_emails': campaign.num_emails,
            'phishing_emails': campaign.num_phishing_emails,
            'legitimate_emails': campaign.num_legitimate_emails,
            'risk_distribution': self._get_risk_distribution(campaign),
            'top_performers': self._get_top_performers(campaign, limit=5),
            'needs_training': self._get_employees_needing_training(campaign)
        }

        return Response(stats, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated, HasCompanyAccess])
    def assigned_employees(self, request, pk=None):
        """Return every employee assigned to this campaign with their quiz status."""
        campaign = self.get_object()
        from django.db.models import Count, Q

        # Single query: join employee, count all questions, count only answered ones
        quizzes = (
            campaign.quizzes
            .select_related('employee')
            .annotate(
                total_q=Count('questions'),
                # Conditional count: questions where the employee has submitted an answer
                answered_q=Count('questions', filter=Q(questions__answer__isnull=False)),
            )
            .order_by('created_at')
        )

        data = []
        for quiz in quizzes:
            score = None
            try:
                # result is a OneToOne; raises RelatedObjectDoesNotExist if quiz not completed
                score = float(quiz.result.score)
            except Exception:
                pass
            # Progress as a percentage; guard against quizzes with no questions yet
            progress = round(quiz.answered_q / quiz.total_q * 100, 1) if quiz.total_q > 0 else 0
            data.append({
                'id': quiz.employee.id,
                'employee_id': quiz.employee.id,
                'first_name': quiz.employee.first_name,
                'last_name': quiz.employee.last_name,
                'email': quiz.employee.email,
                'quiz_status': quiz.status,
                'progress': progress,
                'score': score,
                'assigned_at': quiz.created_at,
            })

        return Response(data, status=status.HTTP_200_OK)

    def _get_risk_distribution(self, campaign):
        """Get distribution of risk levels for campaign results.

        Single SELECT with conditional COUNTs replaces 4 round-trips.
        """
        from django.db.models import Count, Q
        agg = campaign.results.aggregate(
            low=Count('id', filter=Q(risk_level='LOW')),
            medium=Count('id', filter=Q(risk_level='MEDIUM')),
            high=Count('id', filter=Q(risk_level='HIGH')),
            critical=Count('id', filter=Q(risk_level='CRITICAL')),
        )
        return {
            'low': agg['low'],
            'medium': agg['medium'],
            'high': agg['high'],
            'critical': agg['critical'],
        }

    def _get_top_performers(self, campaign, limit=5):
        """Get top performing employees in the campaign."""
        results = campaign.results.order_by('-score')[:limit]
        return QuizResultSerializer(results, many=True).data

    def _get_employees_needing_training(self, campaign):
        """Get employees who need additional training (failed or high risk)."""
        results = campaign.results.filter(
            Q(score__lt=70) | Q(risk_level__in=['HIGH', 'CRITICAL'])
        )
        return QuizResultSerializer(results, many=True).data


class QuizViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Quiz operations.

    Employees can view and take their own quizzes.
    Admins can view all quizzes for their company.
    """

    queryset = Quiz.objects.all()
    serializer_class = QuizSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter quizzes based on user role.

        Pre-joins campaign + employee so list serializers don't trigger
        one extra query per quiz row.
        """
        user = self.request.user
        base = Quiz.objects.select_related('campaign', 'campaign__company', 'employee')

        if user.is_super_admin:
            qs = base.all()
        elif user.is_company_admin:
            qs = base.filter(campaign__company=user.company)
        else:
            # Employees see only their own quizzes
            qs = base.filter(employee=user)

        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param)

        return qs

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def questions(self, request, pk=None):
        """Get all questions for a quiz (without answers)."""
        quiz = self.get_object()

        # Ownership check: employees can only access their own quiz questions
        if quiz.employee != request.user and not request.user.is_company_admin and not request.user.is_super_admin:
            return Response(
                {'error': 'You do not have permission to view this quiz'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Ordered by question_number to render in consistent sequence on the frontend
        questions = quiz.questions.all().order_by('question_number')
        serializer = QuizQuestionSimpleSerializer(questions, many=True)

        # Resolve the personalisation placeholder; prefer first_name then full name then fallback
        employee_name = quiz.employee.first_name or quiz.employee.get_full_name() or 'User'
        questions_data = serializer.data
        for q in questions_data:
            # Mutate serialized data in-place; original EmailTemplate record is unchanged
            if q.get('email_body'):
                q['email_body'] = q['email_body'].replace('{employee_name}', employee_name)

        return Response({
            'quiz_id': quiz.id,
            'campaign_name': quiz.campaign.name,
            'status': quiz.status,
            'total_questions': quiz.total_questions,
            'current_question_index': quiz.current_question_index,
            'questions': questions_data
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsEmployee])
    def start(self, request, pk=None):
        """Start a quiz (mark as in progress)."""
        quiz = self.get_object()

        # Only the assigned employee can start their quiz
        if quiz.employee != request.user:
            return Response(
                {'error': 'You can only start your own quiz'},
                status=status.HTTP_403_FORBIDDEN
            )

        if quiz.status == 'COMPLETED':
            return Response(
                {'error': 'Quiz has already been completed'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if quiz.status == 'IN_PROGRESS':
            return Response(
                QuizSerializer(quiz).data,
                status=status.HTTP_200_OK
            )

        quiz.status = 'IN_PROGRESS'
        quiz.started_at = timezone.now()
        quiz.save()

        return Response(
            QuizSerializer(quiz).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsEmployee])
    def answer_question(self, request, pk=None):
        """Submit an answer to a specific question."""
        quiz = self.get_object()

        # Ownership check: only the assigned employee may submit answers
        if quiz.employee != request.user:
            return Response(
                {'error': 'You can only answer your own quiz questions'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Prevent answers being recorded after the quiz is finalised
        if quiz.status == 'COMPLETED':
            return Response(
                {'error': 'Quiz has already been completed'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # question_number is the user-facing 1-based index, not the DB PK
        question_number = request.data.get('question_number')
        if not question_number:
            return Response(
                {'error': 'question_number is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Scoped lookup ensures the question belongs to this quiz
            question = quiz.questions.get(question_number=question_number)
        except QuizQuestion.DoesNotExist:
            return Response(
                {'error': f'Question {question_number} not found in this quiz'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Validate the answer payload (choice, confidence, timing, red flags)
        serializer = AnswerQuestionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        question.answer = serializer.validated_data['answer']
        question.confidence_level = serializer.validated_data.get('confidence_level')
        question.time_spent_seconds = serializer.validated_data.get('time_spent_seconds')
        question.answered_at = timezone.now()
        # Red flag fields are only meaningful when the employee suspects PHISHING
        if question.answer == 'PHISHING':
            question.selected_flags = serializer.validated_data.get('selected_flags', [])
            question.flag_score = serializer.validated_data.get('flag_score', 0)
            question.flag_max_score = serializer.validated_data.get('flag_max_score', 0)
        else:
            # Clear any stale flag data if the employee changes their answer to LEGITIMATE
            question.selected_flags = []
            question.flag_score = 0
            question.flag_max_score = 0
        # Evaluate correctness and set requires_training flag if needed
        question.check_answer()
        question.save()

        # Advance the high-water mark so the frontend knows the furthest answered question
        quiz.current_question_index = max(quiz.current_question_index, question_number)
        quiz.save()

        return Response({
            'message': 'Answer submitted successfully',
            'question_number': question_number,
            'quiz_progress': quiz.progress_percentage
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsEmployee])
    def submit(self, request, pk=None):
        """Submit and finalize the quiz, calculate results."""
        quiz = self.get_object()

        # Ownership check: only the assigned employee may finalise their quiz
        if quiz.employee != request.user:
            return Response(
                {'error': 'You can only submit your own quiz'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Guard against double-submission
        if quiz.status == 'COMPLETED':
            return Response(
                {'error': 'Quiz has already been completed'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Enforce all-questions-answered before scoring to maintain data integrity
        unanswered = quiz.questions.filter(answer__isnull=True).count()
        if unanswered > 0:
            return Response(
                {'error': f'{unanswered} questions are still unanswered'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Wrap result creation + quiz/campaign updates in a single transaction
        with transaction.atomic():
            # Score the quiz and persist a QuizResult record
            result = self._calculate_quiz_result(quiz)
            quiz.status = 'COMPLETED'
            quiz.completed_at = timezone.now()
            quiz.save()

            # Refresh denormalised campaign stats so the dashboard stays accurate
            campaign = quiz.campaign
            campaign.completed_participants = campaign.quizzes.filter(status='COMPLETED').count()

            # Recompute running average score across all completed results
            completed_results = campaign.results.all()
            if completed_results.exists():
                from django.db.models import Avg
                campaign.average_score = completed_results.aggregate(Avg('score'))['score__avg']

            campaign.save()

        return Response({
            'message': 'Quiz submitted successfully',
            'result': QuizResultSerializer(result).data
        }, status=status.HTTP_201_CREATED)

    def _calculate_quiz_result(self, quiz):
        """Calculate and create quiz result using the hybrid scoring model.

        Scoring per question (0-100):
        - Phishing question, correct answer: 50 base + up to 50 from red flags accuracy
        - Phishing question, wrong answer: 0
        - Legitimate question, correct answer: 100 (50 base + 50, no flags needed)
        - Legitimate question, wrong answer: 0
        """
        # Eager-load email_template on each question to avoid N+1 queries during scoring
        questions = list(quiz.questions.select_related('email_template').all())
        total_questions = len(questions)

        # Simple binary correct/incorrect counts (used for QuizResult fields)
        correct_answers = sum(1 for q in questions if q.is_correct)
        incorrect_answers = total_questions - correct_answers

        # Hybrid score: each question is worth 0-100 points, then averaged
        total_hybrid_score = 0.0
        for q in questions:
            # 50-point base: rewarded only for a correct classification
            base = 50 if q.is_correct else 0

            if q.email_template.email_type == 'PHISHING':
                if q.answer == 'PHISHING' and q.flag_max_score > 0:
                    # Bonus proportional to red-flag accuracy; clamped to [0, 1]
                    rf_ratio = min(1.0, max(0.0, q.flag_score / q.flag_max_score))
                    bonus = rf_ratio * 50
                elif q.answer == 'PHISHING':
                    # Email has no scorable flags — award full bonus to avoid penalising the employee
                    bonus = 50
                else:
                    # Employee classified phishing as legitimate; no red-flag bonus
                    bonus = 0
            else:
                # Legitimate question: flag bonus is binary (50 for correct, 0 for wrong)
                bonus = 50 if q.is_correct else 0

            total_hybrid_score += base + bonus

        # Final score is the mean per-question score (0-100 scale)
        score = total_hybrid_score / total_questions if total_questions > 0 else 0

        # --- Phishing detection breakdown ---
        phishing_questions = [q for q in questions if q.email_template.email_type == 'PHISHING']
        # Correctly flagged phishing emails (true positives)
        phishing_identified = sum(1 for q in phishing_questions if q.answer == 'PHISHING' and q.is_correct)
        # Phishing emails the employee missed (false negatives)
        phishing_missed = sum(1 for q in phishing_questions if q.answer == 'LEGITIMATE' and not q.is_correct)

        legitimate_questions = [q for q in questions if q.email_template.email_type == 'LEGITIMATE']
        # Legitimate emails wrongly flagged as phishing (false positives)
        false_positives = sum(1 for q in legitimate_questions if q.answer == 'PHISHING' and not q.is_correct)

        # --- Time metrics ---
        # None values default to 0 so partially-timed quizzes don't break the sum
        total_time = sum(q.time_spent_seconds or 0 for q in questions)
        avg_time = total_time / total_questions if total_questions > 0 else 0

        # Map score + miss counts to a risk category
        risk_level = self._determine_risk_level(score, phishing_missed, false_positives)

        result = QuizResult.objects.create(
            quiz=quiz,
            employee=quiz.employee,
            campaign=quiz.campaign,
            total_questions=total_questions,
            correct_answers=correct_answers,
            incorrect_answers=incorrect_answers,
            score=round(score, 2),
            phishing_emails_identified=phishing_identified,
            phishing_emails_missed=phishing_missed,
            false_positives=false_positives,
            time_taken_seconds=total_time,
            average_time_per_question=avg_time,
            risk_level=risk_level
        )

        return result

    def _determine_risk_level(self, score, phishing_missed, false_positives):
        """Determine employee risk level based on performance."""
        if score >= 90 and phishing_missed == 0:
            return 'LOW'
        elif score >= 70 and phishing_missed <= 1:
            return 'MEDIUM'
        elif score >= 50 or phishing_missed <= 3:
            return 'HIGH'
        else:
            return 'CRITICAL'

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def result(self, request, pk=None):
        """Get detailed results for a completed quiz."""
        quiz = self.get_object()

        # Only the assigned employee or admins can view results
        if quiz.employee != request.user and not request.user.is_company_admin and not request.user.is_super_admin:
            return Response(
                {'error': 'You do not have permission to view this quiz result'},
                status=status.HTTP_403_FORBIDDEN
            )

        if quiz.status != 'COMPLETED':
            return Response(
                {'error': 'Quiz has not been completed yet'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            result = quiz.result
        except QuizResult.DoesNotExist:
            return Response(
                {'error': 'Result not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Get detailed question results
        questions = quiz.questions.all().order_by('question_number')
        question_details = QuizQuestionDetailSerializer(questions, many=True).data

        return Response({
            'result': QuizResultSerializer(result).data,
            'question_details': question_details
        }, status=status.HTTP_200_OK)
