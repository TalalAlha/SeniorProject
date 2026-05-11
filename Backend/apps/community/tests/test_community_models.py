"""
Unit tests for the Community app models.

Models under test:
- ArticleCategory: auto-slug, update_article_count
- Article: auto-slug, is_published, tags_list, display_author
- PublicQuiz: is_published, question_count, completion_rate
- PublicQuizQuestion: correct_answer property
- Resource: primary_url, file_size_formatted, video_duration_formatted
"""

from django.test import TestCase
from django.utils import timezone

from apps.community.models import (
    Article,
    ArticleCategory,
    PublicQuiz,
    PublicQuizAttempt,
    PublicQuizQuestion,
    Resource,
)


class ArticleCategoryModelTestCase(TestCase):

    def test_auto_generates_slug_from_name(self):
        cat = ArticleCategory.objects.create(name="Email Security Tips")
        self.assertEqual(cat.slug, "email-security-tips")

    def test_duplicate_slug_gets_counter_suffix(self):
        ArticleCategory.objects.create(name="Phishing Basics", slug="phishing-basics")
        cat2 = ArticleCategory.objects.create(name="Phishing Basics")
        self.assertTrue(cat2.slug.startswith("phishing-basics"))
        self.assertNotEqual(cat2.slug, "phishing-basics")

    def test_update_article_count_counts_published_active_articles(self):
        cat = ArticleCategory.objects.create(name="Count Test Category")
        Article.objects.create(
            title="Published Active",
            excerpt="Short summary",
            content="Content here.",
            status="PUBLISHED",
            is_active=True,
            category=cat,
        )
        Article.objects.create(
            title="Draft Article",
            excerpt="Short summary",
            content="Content here.",
            status="DRAFT",
            is_active=True,
            category=cat,
        )
        cat.update_article_count()
        cat.refresh_from_db()
        self.assertEqual(cat.article_count, 1)


class ArticleModelTestCase(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.category = ArticleCategory.objects.create(name="Article Test Category")

    def test_auto_generates_slug_from_title(self):
        article = Article.objects.create(
            title="How To Spot Phishing",
            excerpt="Learn to identify phishing.",
            content="<p>Full content.</p>",
            category=self.category,
        )
        self.assertEqual(article.slug, "how-to-spot-phishing")

    def test_is_published_true_for_published_active_article(self):
        article = Article.objects.create(
            title="Published Active Article",
            excerpt="Test.",
            content="<p>Content.</p>",
            status="PUBLISHED",
            is_active=True,
            published_at=timezone.now(),
        )
        self.assertTrue(article.is_published)

    def test_is_published_false_for_draft(self):
        article = Article.objects.create(
            title="Draft Article",
            excerpt="Test.",
            content="<p>Content.</p>",
            status="DRAFT",
            is_active=True,
        )
        self.assertFalse(article.is_published)

    def test_is_published_false_for_inactive_article(self):
        article = Article.objects.create(
            title="Inactive Published Article",
            excerpt="Test.",
            content="<p>Content.</p>",
            status="PUBLISHED",
            is_active=False,
            published_at=timezone.now(),
        )
        self.assertFalse(article.is_published)

    def test_tags_list_parses_comma_separated_tags(self):
        article = Article.objects.create(
            title="Tags Test Article",
            excerpt="Test.",
            content="<p>Content.</p>",
            tags="phishing, email security, awareness",
        )
        self.assertEqual(article.tags_list, ["phishing", "email security", "awareness"])

    def test_tags_list_empty_when_no_tags(self):
        article = Article.objects.create(
            title="No Tags Article",
            excerpt="Test.",
            content="<p>Content.</p>",
        )
        self.assertEqual(article.tags_list, [])

    def test_display_author_uses_author_name_when_set(self):
        article = Article.objects.create(
            title="Named Author Article",
            excerpt="Test.",
            content="<p>Content.</p>",
            author_name="Dr. Security Expert",
        )
        self.assertEqual(article.display_author, "Dr. Security Expert")

    def test_display_author_defaults_to_phishaware_team(self):
        article = Article.objects.create(
            title="No Author Article",
            excerpt="Test.",
            content="<p>Content.</p>",
        )
        self.assertIn("PhishAware", str(article.display_author))


class PublicQuizModelTestCase(TestCase):

    def test_is_published_true_when_published_and_active(self):
        quiz = PublicQuiz.objects.create(
            title="Published Quiz",
            description="A published quiz.",
            status="PUBLISHED",
            is_active=True,
        )
        self.assertTrue(quiz.is_published)

    def test_is_published_false_when_draft(self):
        quiz = PublicQuiz.objects.create(
            title="Draft Quiz",
            description="A draft quiz.",
            status="DRAFT",
            is_active=True,
        )
        self.assertFalse(quiz.is_published)

    def test_question_count_returns_active_questions_only(self):
        quiz = PublicQuiz.objects.create(
            title="Question Count Quiz",
            description="Testing question count.",
            status="PUBLISHED",
        )
        PublicQuizQuestion.objects.create(
            quiz=quiz,
            question_number=1,
            question_text="Is this a phishing email?",
            options=["Yes", "No"],
            correct_answer_index=0,
            is_active=True,
        )
        PublicQuizQuestion.objects.create(
            quiz=quiz,
            question_number=2,
            question_text="Inactive question",
            options=["Yes", "No"],
            correct_answer_index=1,
            is_active=False,
        )
        self.assertEqual(quiz.question_count, 1)

    def test_completion_rate_is_zero_when_no_attempts(self):
        quiz = PublicQuiz.objects.create(
            title="Zero Attempts Quiz",
            description="No attempts made.",
        )
        self.assertEqual(quiz.completion_rate, 0)


class PublicQuizQuestionModelTestCase(TestCase):

    def test_correct_answer_returns_text_at_index(self):
        quiz = PublicQuiz.objects.create(
            title="Answer Test Quiz",
            description="Testing correct_answer property.",
        )
        q = PublicQuizQuestion.objects.create(
            quiz=quiz,
            question_number=1,
            question_text="Which of these is a red flag in an email?",
            options=["Sender's name", "Suspicious link", "Company logo", "Formal tone"],
            correct_answer_index=1,
        )
        self.assertEqual(q.correct_answer, "Suspicious link")

    def test_correct_answer_none_for_empty_options(self):
        quiz = PublicQuiz.objects.create(
            title="Empty Options Quiz",
            description="Testing empty options.",
        )
        q = PublicQuizQuestion(
            quiz=quiz,
            question_number=1,
            question_text="No options question.",
            options=[],
            correct_answer_index=0,
        )
        self.assertIsNone(q.correct_answer)


class ResourceModelTestCase(TestCase):

    def test_primary_url_returns_file_url_when_set(self):
        r = Resource.objects.create(
            title="Security PDF",
            description="A security guide PDF.",
            resource_type="PDF",
            file_url="https://phishaware.sa/guides/security.pdf",
        )
        self.assertEqual(r.primary_url, "https://phishaware.sa/guides/security.pdf")

    def test_primary_url_falls_back_to_external_url(self):
        r = Resource.objects.create(
            title="Video Resource",
            description="An awareness video.",
            resource_type="VIDEO",
            external_url="https://youtube.com/watch?v=example",
        )
        self.assertEqual(r.primary_url, "https://youtube.com/watch?v=example")

    def test_file_size_formatted_converts_bytes_to_kb(self):
        r = Resource(
            title="Test",
            description="desc",
            resource_type="PDF",
            file_size_bytes=2048,
        )
        self.assertEqual(r.file_size_formatted, "2.0 KB")

    def test_file_size_formatted_none_when_not_set(self):
        r = Resource(title="Test", description="desc", resource_type="PDF")
        self.assertIsNone(r.file_size_formatted)

    def test_video_duration_formatted(self):
        r = Resource(
            title="Video",
            description="desc",
            resource_type="VIDEO",
            video_duration_seconds=185,
        )
        self.assertEqual(r.video_duration_formatted, "3m 5s")
