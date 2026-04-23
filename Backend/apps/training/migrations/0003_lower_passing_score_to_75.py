from django.db import migrations, models
import django.core.validators


def lower_passing_score(apps, schema_editor):
    """Lower TrainingModule.passing_score from 80 → 75 and re-evaluate
    any RemediationTraining marked FAILED whose quiz_score now meets the
    new bar so admin and employee views agree on PASS/FAIL."""
    TrainingModule = apps.get_model('training', 'TrainingModule')
    RemediationTraining = apps.get_model('training', 'RemediationTraining')

    TrainingModule.objects.filter(passing_score=80).update(passing_score=75)

    failed = RemediationTraining.objects.filter(
        status='FAILED', quiz_score__isnull=False
    ).select_related('training_module')
    for rt in failed:
        if rt.quiz_score is not None and rt.quiz_score >= rt.training_module.passing_score:
            rt.status = 'PASSED'
            rt.save(update_fields=['status', 'updated_at'])


def restore_passing_score(apps, schema_editor):
    TrainingModule = apps.get_model('training', 'TrainingModule')
    TrainingModule.objects.filter(passing_score=75).update(passing_score=80)


class Migration(migrations.Migration):

    dependencies = [
        ('training', '0002_interactivelessonprogress'),
    ]

    operations = [
        migrations.AlterField(
            model_name='trainingmodule',
            name='passing_score',
            field=models.PositiveIntegerField(
                default=75,
                help_text='Minimum percentage required to pass',
                validators=[
                    django.core.validators.MinValueValidator(50),
                    django.core.validators.MaxValueValidator(100),
                ],
                verbose_name='passing score',
            ),
        ),
        migrations.RunPython(lower_passing_score, restore_passing_score),
    ]
