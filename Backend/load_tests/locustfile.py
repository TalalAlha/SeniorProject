"""
Locust load test for PhishAware backend.
Simulates concurrent users hitting the public API and authenticated endpoints.

Seeded test user required before running:
  python manage.py seed_load_test_user

Run headless (50 users, 5/sec, 2 min):
  locust -f load_tests/locustfile.py --host=http://localhost:8000 \
         --headless -u 50 -r 5 -t 2m --csv=load_test_results

Run with web UI:
  locust -f load_tests/locustfile.py --host=http://localhost:8000
"""
from locust import HttpUser, task, between
import random


class PublicPortalUser(HttpUser):
    """Simulates anonymous visitors on the community portal."""
    wait_time = between(1, 3)
    weight = 3

    @task(3)
    def view_articles(self):
        self.client.get("/api/v1/community/articles/")

    @task(2)
    def view_categories(self):
        self.client.get("/api/v1/community/categories/")

    @task(2)
    def view_public_quizzes(self):
        self.client.get("/api/v1/community/quizzes/")

    @task(1)
    def view_portal_homepage(self):
        self.client.get("/api/v1/community/portal/")


class AuthenticatedEmployeeUser(HttpUser):
    """Simulates employees browsing their dashboard."""
    wait_time = between(2, 5)
    weight = 1

    def on_start(self):
        response = self.client.post("/api/v1/auth/login/", json={
            "email": "loadtest.employee@phishaware.com",
            "password": "LoadTest123!",
        })
        if response.status_code == 200:
            self.token = response.json().get("access")
            self.client.headers.update({"Authorization": f"Bearer {self.token}"})
        else:
            self.token = None

    @task(2)
    def view_profile(self):
        if self.token:
            self.client.get("/api/v1/auth/profile/")

    @task(2)
    def view_my_trainings(self):
        if self.token:
            self.client.get("/api/v1/training/assignments/my_trainings/")

    @task(1)
    def view_leaderboard(self):
        if self.token:
            self.client.get("/api/v1/gamification/leaderboard/")

    @task(1)
    def view_my_risk_score(self):
        if self.token:
            self.client.get("/api/v1/training/risk-scores/my_score/")
