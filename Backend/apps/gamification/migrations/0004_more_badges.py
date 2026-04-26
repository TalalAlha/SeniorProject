from django.db import migrations, models


NEW_BADGES = [
    {
        'name': 'Vigilant',
        'name_ar': 'يقظ',
        'badge_type': 'SIMULATION_SURVIVOR',
        'description': 'Survived 5 phishing simulations without clicking',
        'description_ar': 'نجوت من 5 محاكاة تصيد دون النقر',
        'icon': '🛡️',
        'color': '#10B981',
        'rarity': 'UNCOMMON',
        'points_awarded': 100,
        'criteria': {'simulations_received_min': 5, 'simulations_clicked': 0},
        'is_active': True,
        'is_hidden': False,
    },
    {
        'name': 'On a Roll',
        'name_ar': 'في تصاعد',
        'badge_type': 'STREAK_MASTER',
        'description': 'Maintained a 7-day activity streak',
        'description_ar': 'حافظت على نشاط متتالي لمدة 7 أيام',
        'icon': '🔥',
        'color': '#F59E0B',
        'rarity': 'UNCOMMON',
        'points_awarded': 75,
        'criteria': {'streak_days': 7},
        'is_active': True,
        'is_hidden': False,
    },
    {
        'name': 'Top Reporter',
        'name_ar': 'مُبلِّغ متميز',
        'badge_type': 'TOP_REPORTER',
        'description': 'Reported 25 or more phishing simulation emails',
        'description_ar': 'أبلغت عن 25 رسالة محاكاة تصيد أو أكثر',
        'icon': '📣',
        'color': '#EC4899',
        'rarity': 'EPIC',
        'points_awarded': 250,
        'criteria': {'phishing_reported': 25},
        'is_active': True,
        'is_hidden': False,
    },
    {
        'name': 'Quiz Apprentice',
        'name_ar': 'متدرب الاختبارات',
        'badge_type': 'QUIZ_APPRENTICE',
        'description': 'Completed 5 phishing awareness quizzes',
        'description_ar': 'أكملت 5 اختبارات للتوعية بالتصيد',
        'icon': '📘',
        'color': '#3B82F6',
        'rarity': 'UNCOMMON',
        'points_awarded': 75,
        'criteria': {'quizzes_completed': 5},
        'is_active': True,
        'is_hidden': False,
    },
    {
        'name': 'Quiz Expert',
        'name_ar': 'خبير الاختبارات',
        'badge_type': 'QUIZ_EXPERT',
        'description': 'Completed 25 phishing awareness quizzes',
        'description_ar': 'أكملت 25 اختبار للتوعية بالتصيد',
        'icon': '🎓',
        'color': '#8B5CF6',
        'rarity': 'EPIC',
        'points_awarded': 200,
        'criteria': {'quizzes_completed': 25},
        'is_active': True,
        'is_hidden': False,
    },
    {
        'name': 'Comeback Kid',
        'name_ar': 'العائد القوي',
        'badge_type': 'COMEBACK_KID',
        'description': 'Improved from HIGH or CRITICAL risk all the way to LOW',
        'description_ar': 'تحسنت من خطر عالي أو حرج إلى خطر منخفض',
        'icon': '📉',
        'color': '#06B6D4',
        'rarity': 'EPIC',
        'points_awarded': 200,
        'criteria': {'risk_improvement': 'HIGH_OR_CRITICAL_TO_LOW'},
        'is_active': True,
        'is_hidden': False,
    },
]


def create_new_badges(apps, schema_editor):
    Badge = apps.get_model('gamification', 'Badge')
    for badge_data in NEW_BADGES:
        Badge.objects.get_or_create(
            badge_type=badge_data['badge_type'],
            defaults=badge_data,
        )


def remove_new_badges(apps, schema_editor):
    Badge = apps.get_model('gamification', 'Badge')
    Badge.objects.filter(badge_type__in=[b['badge_type'] for b in NEW_BADGES]).delete()


BADGE_TYPE_CHOICES = [
    ('FIRST_QUIZ_COMPLETED', 'First Quiz Completed'),
    ('PERFECT_QUIZ_SCORE', 'Perfect Quiz Score'),
    ('PHISH_SLAYER', 'Phish Slayer'),
    ('TRAINING_CHAMPION', 'Training Champion'),
    ('SECURITY_AWARE', 'Security Aware'),
    ('QUICK_LEARNER', 'Quick Learner'),
    ('SIMULATION_SURVIVOR', 'Simulation Survivor'),
    ('STREAK_MASTER', 'Streak Master'),
    ('TOP_REPORTER', 'Top Reporter'),
    ('QUIZ_APPRENTICE', 'Quiz Apprentice'),
    ('QUIZ_EXPERT', 'Quiz Expert'),
    ('COMEBACK_KID', 'Comeback Kid'),
]


class Migration(migrations.Migration):

    dependencies = [
        ('gamification', '0003_add_metadata_to_points_transaction'),
    ]

    operations = [
        migrations.AlterField(
            model_name='badge',
            name='badge_type',
            field=models.CharField(
                choices=BADGE_TYPE_CHOICES,
                max_length=30,
                unique=True,
                verbose_name='badge type',
            ),
        ),
        migrations.RunPython(create_new_badges, remove_new_badges),
    ]
