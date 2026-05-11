"""
Locust load test for PhishAware backend.
All endpoints verified from real Django server logs.

Seed test users before running:
  python manage.py seed_load_test_user

Run with web UI:
  python -m locust -f load_tests/locustfile.py --host=http://localhost:8000

Run headless (50 users, 5/sec, 2 min):
  python -m locust -f load_tests/locustfile.py --host=http://localhost:8000
         --headless -u 50 -r 5 -t 2m --csv=load_test_results
"""
import requests as _requests

from locust import HttpUser, task, between, events

EMPLOYEE_EMAIL = "loadtest.employee@phishaware.com"
ADMIN_EMAIL    = "loadtest.admin@phishaware.com"
PASSWORD       = "LoadTest123!"

# Tokens fetched once before the test — reused by all virtual users.
# This avoids hammering the login throttle (10/min per IP).
_tokens = {"employee": None, "admin": None, "admin_company_id": None}


@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    """Login once per user type before spawning any virtual users."""
    host = environment.host

    # Employee token
    resp = _requests.post(
        f"{host}/api/v1/auth/login/",
        json={"email": EMPLOYEE_EMAIL, "password": PASSWORD},
    )
    if resp.status_code == 200:
        _tokens["employee"] = resp.json().get("access")
        print(f"[setup] Employee token obtained.")
    else:
        print(f"[setup] Employee login failed: {resp.status_code} {resp.text}")

    # Admin token + company ID
    resp = _requests.post(
        f"{host}/api/v1/auth/login/",
        json={"email": ADMIN_EMAIL, "password": PASSWORD},
    )
    if resp.status_code == 200:
        _tokens["admin"] = resp.json().get("access")
        profile = _requests.get(
            f"{host}/api/v1/auth/profile/",
            headers={"Authorization": f"Bearer {_tokens['admin']}"},
        )
        _tokens["admin_company_id"] = profile.json().get("company")
        print(f"[setup] Admin token obtained. Company ID: {_tokens['admin_company_id']}")
    else:
        print(f"[setup] Admin login failed: {resp.status_code} {resp.text}")


class EmployeeUser(HttpUser):
    """
    Simulates an employee using their dashboard.
    Covers: community daily challenge, training progress, notifications, profile.
    """
    wait_time = between(1, 3)
    weight = 2

    def on_start(self):
        if not _tokens["employee"]:
            self.interrupt()
            return
        self.client.headers.update({"Authorization": f"Bearer {_tokens['employee']}"})

    @task(3)
    def view_profile(self):
        self.client.get("/api/v1/auth/profile/")

    @task(3)
    def view_notifications(self):
        self.client.get("/api/v1/notifications/")

    @task(3)
    def view_community_daily_challenge(self):
        self.client.get("/api/v1/community/portal/daily_challenge/?lang=en")

    @task(2)
    def view_training_progress(self):
        self.client.get("/api/v1/training/interactive/progress/phishing/en/")

    @task(1)
    def save_training_progress(self):
        self.client.post("/api/v1/training/interactive/save/", json={
            "lesson_type": "phishing",
            "current_scene": 1,
        })


class AdminUser(HttpUser):
    """
    Simulates a company admin managing their organization.
    Covers: company stats, employees, simulations, campaigns, analytics.
    """
    wait_time = between(2, 4)
    weight = 1

    def on_start(self):
        if not _tokens["admin"]:
            self.interrupt()
            return
        self.client.headers.update({"Authorization": f"Bearer {_tokens['admin']}"})
        self.company_id = _tokens["admin_company_id"]

    @task(3)
    def view_company_stats(self):
        if self.company_id:
            self.client.get(f"/api/v1/companies/{self.company_id}/stats/")

    @task(3)
    def view_company_users(self):
        if self.company_id:
            self.client.get(f"/api/v1/companies/{self.company_id}/users/")

    @task(2)
    def view_simulations(self):
        self.client.get("/api/v1/simulations/campaigns/")

    @task(2)
    def view_campaigns(self):
        self.client.get("/api/v1/campaigns/campaigns/")

    @task(2)
    def view_notifications(self):
        self.client.get("/api/v1/notifications/")

    @task(1)
    def view_training_effectiveness(self):
        self.client.get("/api/v1/analytics/training/effectiveness/")
