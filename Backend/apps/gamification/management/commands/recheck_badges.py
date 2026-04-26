"""
Re-check time-based badges for every employee.

Some badges (most notably SECURITY_AWARE — LOW risk maintained for 30 days)
only trigger via signals when their underlying data changes. An employee
who reaches LOW and then has no further activity will never have a
RiskScore.save() and therefore never qualifies via the signal path.

Run this on a schedule (cron / Windows Task Scheduler):

    python manage.py recheck_badges
"""

from django.core.management.base import BaseCommand
from apps.training.models import RiskScore
from apps.gamification.services import (
    check_security_aware_badge,
    check_comeback_kid_badge,
    check_simulation_survivor_badge,
    check_streak_master_badge,
    check_training_champion_badge,
)


class Command(BaseCommand):
    help = 'Re-check time/state-based badges for every employee with a risk score.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--employee',
            type=int,
            default=None,
            help='Re-check only this employee id (otherwise: all employees with a RiskScore).',
        )

    def handle(self, *args, **options):
        qs = RiskScore.objects.select_related('employee')
        if options['employee']:
            qs = qs.filter(employee_id=options['employee'])

        total = qs.count()
        awarded = 0

        for rs in qs.iterator():
            employee = rs.employee
            if not employee or employee.role != 'EMPLOYEE':
                continue

            results = [
                check_simulation_survivor_badge(employee),
                check_streak_master_badge(employee),
                check_training_champion_badge(employee),
            ]
            if rs.risk_level == 'LOW':
                results.append(check_security_aware_badge(employee, rs))
                results.append(check_comeback_kid_badge(employee, rs))

            awarded += sum(1 for r in results if r is not None)

        self.stdout.write(self.style.SUCCESS(
            f'Re-checked {total} employees, awarded {awarded} new badge(s).'
        ))
