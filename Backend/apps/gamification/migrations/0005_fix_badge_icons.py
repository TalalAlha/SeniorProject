from django.db import migrations

ICON_MAP = {
    'FIRST_QUIZ_COMPLETED': '🏆',
    'PERFECT_QUIZ_SCORE': '⭐',
    'PHISH_SLAYER': '🐟',
    'TRAINING_CHAMPION': '🏅',
    'SECURITY_AWARE': '✅',
    'QUICK_LEARNER': '⚡',
}


def fix_icons(apps, schema_editor):
    Badge = apps.get_model('gamification', 'Badge')
    for badge_type, emoji in ICON_MAP.items():
        Badge.objects.filter(badge_type=badge_type).update(icon=emoji)


def reverse_icons(apps, schema_editor):
    REVERSE_MAP = {
        'FIRST_QUIZ_COMPLETED': 'trophy',
        'PERFECT_QUIZ_SCORE': 'star',
        'PHISH_SLAYER': 'shield',
        'TRAINING_CHAMPION': 'award',
        'SECURITY_AWARE': 'verified',
        'QUICK_LEARNER': 'bolt',
    }
    Badge = apps.get_model('gamification', 'Badge')
    for badge_type, text in REVERSE_MAP.items():
        Badge.objects.filter(badge_type=badge_type).update(icon=text)


class Migration(migrations.Migration):

    dependencies = [
        ('gamification', '0004_more_badges'),
    ]

    operations = [
        migrations.RunPython(fix_icons, reverse_code=reverse_icons),
    ]
