from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Remove old training modules, keep only 3 phishing awareness modules'

    def handle(self, *args, **options):
        keep_titles = [
            'Email Phishing Awareness',
            'SMS Phishing (Smishing) Awareness',
            'Voice Phishing (Vishing) Awareness',
        ]

        # Try training app (TrainingModule)
        try:
            from apps.training.models import TrainingModule
            old = TrainingModule.objects.exclude(title_en__in=keep_titles)
            count = old.count()
            self.stdout.write(f'Found {count} old modules in TrainingModule:')
            for m in old:
                self.stdout.write(f'  - {m.title_en}')
            old.delete()
            self.stdout.write(self.style.SUCCESS(f'Deleted {count} from TrainingModule'))

            remaining = TrainingModule.objects.all()
            self.stdout.write(f'Remaining: {remaining.count()} modules')
            for m in remaining:
                self.stdout.write(f'  ✓ {m.title_en}')
        except Exception as e:
            self.stdout.write(f'TrainingModule: {e}')

        # Try assessments app (RemediationTraining) - clean orphaned records
        try:
            from apps.assessments.models import RemediationTraining
            old = RemediationTraining.objects.exclude(title__in=keep_titles)
            count = old.count()
            self.stdout.write(f'Found {count} old modules in RemediationTraining:')
            for m in old:
                self.stdout.write(f'  - {m.title}')
            old.delete()
            self.stdout.write(self.style.SUCCESS(f'Deleted {count} from RemediationTraining'))

            remaining = RemediationTraining.objects.all()
            self.stdout.write(f'Remaining: {remaining.count()} modules')
            for m in remaining:
                self.stdout.write(f'  ✓ {m.title}')
        except Exception as e:
            self.stdout.write(f'RemediationTraining: {e}')

        self.stdout.write(self.style.SUCCESS('\nCleanup complete!'))
