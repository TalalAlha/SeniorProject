"""
Management command: clean_training.

Removes legacy or extra training modules and remediation assignments,
keeping only the three core phishing-awareness modules:
  - Email Phishing Awareness
  - SMS Phishing (Smishing) Awareness
  - Voice Phishing (Vishing) Awareness

Usage:
    python manage.py clean_training
"""
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    """Management command that prunes training data to the canonical three modules."""

    help = 'Remove old training modules, keep only 3 phishing awareness modules'

    def handle(self, *args, **options):
        """Delete all TrainingModule and RemediationTraining rows not in the keep list."""
        keep_titles_en = [
            'Email Phishing Awareness',
            'SMS Phishing (Smishing) Awareness',
            'Voice Phishing (Vishing) Awareness',
        ]

        deleted_total = 0

        # Check RemediationTraining
        try:
            from apps.training.models import RemediationTraining
            all_modules = RemediationTraining.objects.all()
            self.stdout.write(f'RemediationTraining has {all_modules.count()} records')

            old = RemediationTraining.objects.exclude(
                training_module__title__in=keep_titles_en
            )
            count = old.count()
            if count > 0:
                for m in old:
                    self.stdout.write(f'  DELETING assignment: {m}')
                old.delete()
                deleted_total += count
                self.stdout.write(
                    self.style.SUCCESS(f'Deleted {count} from RemediationTraining')
                )
        except Exception as e:
            self.stdout.write(f'RemediationTraining: {e}')

        # Check TrainingModule
        try:
            from apps.training.models import TrainingModule
            all_modules = TrainingModule.objects.all()
            self.stdout.write(f'\nTrainingModule has {all_modules.count()} modules:')
            for m in all_modules:
                self.stdout.write(f'  [{m.id}] {m.title}')

            old = TrainingModule.objects.exclude(title__in=keep_titles_en)
            count = old.count()
            if count > 0:
                for m in old:
                    self.stdout.write(f'  DELETING: {m.title}')
                old.delete()
                deleted_total += count
                self.stdout.write(
                    self.style.SUCCESS(f'Deleted {count} from TrainingModule')
                )
        except Exception as e:
            self.stdout.write(f'TrainingModule: {e}')

        self.stdout.write(
            self.style.SUCCESS(f'\nTotal deleted: {deleted_total}')
        )

        # Show what remains
        self.stdout.write('\nRemaining modules:')
        try:
            from apps.training.models import TrainingModule
            for m in TrainingModule.objects.all():
                self.stdout.write(f'  [TrainingModule] {m.title}')
        except Exception:
            pass
