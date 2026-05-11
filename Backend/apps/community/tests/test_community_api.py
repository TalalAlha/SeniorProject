"""
Integration tests for the Community API (public awareness portal).

All community endpoints use AllowAny — no authentication required.

Endpoints under test (mounted at /api/v1/community/):
  GET  articles/                 - list published articles
  GET  quizzes/                  - list published quizzes
  GET  resources/                - list active resources
  GET  portal/homepage/          - featured portal content
"""

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.community.models import Article, ArticleCategory, PublicQuiz, Resource


class CommunityArticleAPITest(APITestCase):

    @classmethod
    def setUpTestData(cls):
        cls.category = ArticleCategory.objects.create(name="API Test Category")
        cls.published_article = Article.objects.create(
            title="Published Security Article",
            excerpt="Key article for awareness.",
            content="<p>Full security content.</p>",
            status="PUBLISHED",
            is_active=True,
            category=cls.category,
        )
        cls.draft_article = Article.objects.create(
            title="Draft Article Should Be Hidden",
            excerpt="This is a draft.",
            content="<p>Draft content.</p>",
            status="DRAFT",
            is_active=True,
            category=cls.category,
        )

    def test_article_list_returns_200_without_auth(self):
        resp = self.client.get(reverse("community:article-list"))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_article_list_returns_only_published_articles(self):
        resp = self.client.get(reverse("community:article-list"))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        results = resp.data.get("results", resp.data) if isinstance(resp.data, dict) else resp.data
        titles = [a.get("title") for a in results]
        self.assertNotIn("Draft Article Should Be Hidden", titles)


class CommunityQuizAPITest(APITestCase):

    @classmethod
    def setUpTestData(cls):
        cls.published_quiz = PublicQuiz.objects.create(
            title="Published Public Quiz",
            description="A quiz accessible to the public.",
            status="PUBLISHED",
            is_active=True,
        )
        cls.draft_quiz = PublicQuiz.objects.create(
            title="Draft Quiz Hidden",
            description="This should not appear.",
            status="DRAFT",
            is_active=True,
        )

    def test_quiz_list_returns_200_without_auth(self):
        resp = self.client.get(reverse("community:quiz-list"))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_quiz_list_returns_only_published_quizzes(self):
        resp = self.client.get(reverse("community:quiz-list"))
        results = resp.data.get("results", resp.data) if isinstance(resp.data, dict) else resp.data
        titles = [q.get("title") for q in results]
        self.assertNotIn("Draft Quiz Hidden", titles)


class CommunityResourceAPITest(APITestCase):

    @classmethod
    def setUpTestData(cls):
        cls.resource = Resource.objects.create(
            title="Active Security Resource",
            description="Useful phishing awareness PDF.",
            resource_type="PDF",
            is_active=True,
        )
        cls.inactive_resource = Resource.objects.create(
            title="Inactive Resource Hidden",
            description="Old resource.",
            resource_type="PDF",
            is_active=False,
        )

    def test_resource_list_returns_200_without_auth(self):
        resp = self.client.get(reverse("community:resource-list"))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)


class CommunityPortalAPITest(APITestCase):

    def test_portal_homepage_returns_200_without_auth(self):
        resp = self.client.get(reverse("community:portal-homepage"))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
