# PhishAware — Backend

Django REST Framework API powering the PhishAware cybersecurity awareness platform. JWT-secured, multi-tenant, bilingual (English + Arabic), and shipped with a pair of trained LSTM models that generate phishing and legitimate emails on demand.

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Framework | Django 5.x + Django REST Framework 3.x |
| Authentication | SimpleJWT (short-lived access + blacklistable refresh tokens) |
| Database | SQLite (development) / PostgreSQL-ready (production) |
| AI | PyTorch 2.x — custom 3-layer LSTM, 512 hidden, 256 embedding |
| Email | SendGrid via Django SMTP backend |
| API Docs | drf-yasg (Swagger UI + ReDoc) |
| Config | python-decouple (`.env`) |
| CORS | django-cors-headers |

---

## Project Structure

```
Backend/
├── apps/
│   ├── accounts/        Auth, registration, email verification, invitations, password reset
│   ├── assessments/     Email template library + AI email generation endpoint
│   ├── analytics/       Dashboard stats, trends, risk analytics, CSV export
│   ├── campaigns/       Awareness campaigns: email classification quizzes, scoring
│   ├── community/       Public community portal (no auth)
│   ├── companies/       Company CRUD, user management, CSV import
│   ├── core/            Shared permissions, email helpers, HTML email templates
│   ├── gamification/    Badges, points ledger, leaderboard
│   ├── notifications/   36-type notification system
│   ├── simulations/     Live phishing simulations: email dispatch, click/report tracking
│   └── training/        Modules, quizzes, risk scores, remediation assignments
├── ml_models/
│   ├── email_generator.py     Public API: EmailGenerator.generate_email()
│   ├── lstm_model.py          Model architecture
│   ├── vocabulary.py          Tokenization
│   ├── phishing_lstm_en.pth   Trained EN weights (14k dataset)
│   ├── phishing_lstm_ar.pth   Trained AR weights (10k dataset)
│   ├── vocab_en.json / vocab_ar.json
│   └── model_config.json
├── phishaware_backend/
│   ├── settings.py
│   └── urls.py
├── requirements.txt
└── manage.py
```

---

## Setup

### 1. Virtual environment

```bash
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
```

### 2. Dependencies

```bash
pip install -r requirements.txt
pip install torch                 # Required for AI email generation
```

> `requirements.txt` intentionally omits PyTorch because CPU / CUDA builds depend on the host. Install the variant appropriate for your machine.

### 3. Environment variables

Create `.env` in `Backend/`:

```env
SECRET_KEY=your-django-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
FRONTEND_URL=http://localhost:5173

# Email — SendGrid SMTP relay
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=your-sendgrid-api-key
DEFAULT_FROM_EMAIL=PhishAware <no-reply@yourdomain.com>
SENDGRID_VERIFIED_SENDER=no-reply@yourdomain.com
```

### 4. Migrate, seed, run

```bash
python manage.py migrate
python manage.py seed_simulation_templates   # 15 phishing templates (8 EN + 7 AR)
python manage.py seed_training               # 3 modules with 5 bilingual questions each
python manage.py createsuperuser
python manage.py runserver
```

API: `http://localhost:8000/api/v1/`
Swagger UI: `http://localhost:8000/api/docs/`
ReDoc: `http://localhost:8000/api/redoc/`

---

## API Reference

### Authentication — `/api/v1/auth/`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/register/` | Register new user | Public |
| POST | `/login/` | Obtain JWT tokens | Public |
| POST | `/logout/` | Blacklist refresh token | Required |
| POST | `/token/refresh/` | Refresh access token | Public |
| POST | `/verify-email/<uuid>/` | Confirm email address | Public |
| POST | `/resend-verification/` | Resend verification email | Public |
| POST | `/password-reset/` | Request password reset link | Public |
| POST | `/password-reset/<uuid>/` | Set new password via token | Public |
| GET/PATCH | `/profile/` | Get or update own profile | Required |
| POST | `/change-password/` | Change password | Required |

### Employee Invitations — `/api/v1/employees/`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/invite/` | Send invitation email | Admin |
| GET | `/invite/<uuid>/` | Get invitation details | Public |
| POST | `/invite/<uuid>/accept/` | Accept invitation, set password | Public |
| GET | `/pending/` | List pending invitations | Admin |
| POST | `/<id>/resend/` | Resend invitation (rotates token) | Admin |
| DELETE | `/<id>/cancel/` | Cancel invitation | Admin |

### Companies — `/api/v1/companies/`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/register/` | Self-service company registration | Public |
| GET | `/` | List companies | Required |
| GET/PATCH | `/<id>/` | Company detail / update | Required |
| POST | `/<id>/activate/` | Activate company | Super Admin |
| POST | `/<id>/deactivate/` | Deactivate company | Super Admin |
| GET | `/<id>/stats/` | Company statistics | Admin |
| GET | `/<id>/users/` | List company users | Admin |
| DELETE | `/<id>/users/<uid>/remove/` | Remove user | Admin |
| POST | `/<id>/import_csv/` | Bulk import users from CSV | Admin |
| GET | `/my_company/` | Get own company | Required |

### Awareness Campaigns — `/api/v1/campaigns/`

Quiz-based exercises where employees classify emails as phishing or legitimate. No emails are sent — scoring is immediate.

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET/POST | `/campaigns/` | List / create campaigns | Admin |
| GET/PATCH/DELETE | `/campaigns/<id>/` | Campaign detail / update / delete | Admin |
| POST | `/campaigns/<id>/activate/` | Activate campaign | Admin |
| POST | `/campaigns/<id>/assign_to_employees/` | Assign + create employee quizzes | Admin |
| GET | `/campaigns/<id>/statistics/` | Completion rate, avg score, risk distribution | Admin |
| GET | `/campaigns/<id>/assigned_employees/` | Employees with quiz status and score | Admin |
| GET | `/quizzes/` | List quizzes (own for employees, all for admins) | Required |
| GET | `/quizzes/<id>/questions/` | Quiz questions (no answers revealed) | Required |
| POST | `/quizzes/<id>/start/` | Start quiz | Employee |
| POST | `/quizzes/<id>/answer_question/` | Submit answer for one question | Employee |
| POST | `/quizzes/<id>/submit/` | Finalize and score quiz | Employee |
| GET | `/quizzes/<id>/result/` | Full per-question breakdown | Required |

### Assessments & AI Email Generation — `/api/v1/assessments/`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET/POST | `/email-templates/` | List / create reusable email templates | Required |
| GET/PATCH/DELETE | `/email-templates/<id>/` | Template detail / update / delete | Required |
| POST | `/ai/generate-emails/` | Generate phishing or legitimate emails via LSTM | Admin |

### Live Simulations — `/api/v1/simulations/`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET/POST | `/templates/` | List / create templates | Required |
| GET/PATCH | `/templates/<id>/` | Template detail / update | Required |
| GET/POST | `/campaigns/` | List / create campaigns | Required |
| GET/PATCH | `/campaigns/<id>/` | Campaign detail / update | Required |
| POST | `/campaigns/<id>/send/` | Dispatch simulation emails | Admin |
| GET | `/link/<token>/` | Track lure-link click → redirects to feedback page | **Public** |
| POST | `/report/<token>/` | Employee reports email as phishing | **Public** |
| POST | `/credentials/<token>/` | Log credential submission | **Public** |
| GET | `/feedback/<token>/` | Educational feedback (red flags + explanation) | **Public** |

### Training — `/api/v1/training/`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/risk-scores/` | List risk scores (role-filtered) | Required |
| GET | `/risk-scores/my_score/` | Own risk score | Required |
| GET | `/risk-scores/statistics/` | Company-wide statistics | Admin |
| GET | `/risk-scores/<id>/history/` | Score change history | Required |
| GET/POST | `/modules/` | List / create training modules | Required |
| GET | `/modules/<id>/questions/` | Module quiz questions | Required |
| GET/POST | `/assignments/` | List / create assignments | Required |
| POST | `/assignments/<id>/start/` | Start training | Required |
| POST | `/assignments/<id>/view_content/` | Mark content viewed | Required |
| GET | `/assignments/<id>/quiz/` | Get quiz questions | Required |
| POST | `/assignments/<id>/submit_quiz/` | Submit quiz answers | Required |
| POST | `/assignments/bulk_assign/` | Bulk assign training | Admin |
| GET | `/assignments/my_trainings/` | Own assignments | Required |
| GET | `/assignments/overdue/` | Overdue assignments | Admin |

### Gamification — `/api/v1/gamification/`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET/POST | `/badges/` | List / create badges (admin for POST) | Required |
| GET/PUT/DELETE | `/badges/<id>/` | Badge detail / update / delete | Required / Admin |
| GET | `/badges/my_badges/` | Own earned badges | Required |
| GET | `/badges/recent/` | Recently awarded badges | Required |
| POST | `/badges/<id>/bulk_award/` | Bulk-award a badge | Admin |
| GET | `/points/` | List points records (admin sees all) | Required |
| GET | `/points/my_summary/` | Own points summary | Required |
| GET | `/points/my_transactions/` | Own points transactions | Required |
| POST | `/points/adjust/` | Manual admin adjustment | Admin |
| GET | `/leaderboard/` | Leaderboard (filter by period, company, limit) | Required |
| GET | `/leaderboard/my_position/` | Own leaderboard position | Required |

### Analytics — `/api/v1/analytics/`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/dashboard/overview/` | Platform / company overview stats | Required |
| GET | `/dashboard/trends/` | Time-series data (`?period=7d\|30d\|90d`) | Required |
| GET | `/campaigns/<id>/` | Detailed campaign analytics | Required |
| GET | `/risk/distribution/` | Risk score distribution | Required |
| GET | `/risk/trends/` | Risk score trends over time | Required |
| GET | `/risk/high_risk_employees/` | High-risk employee list | Admin |
| GET | `/training/` | Training summary | Required |
| GET | `/training/effectiveness/` | Training impact analysis | Required |
| POST | `/export/csv/` | Export data to CSV | Required |

### Notifications — `/api/v1/notifications/`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | List own notifications | Required |
| GET | `/unread_count/` | Unread count | Required |
| POST | `/<id>/mark_read/` | Mark single as read | Required |
| POST | `/mark_all_read/` | Mark all as read | Required |
| DELETE | `/clear_all/` | Delete all notifications | Required |

### Community — `/api/v1/community/`

Public resources accessible without authentication (training topics, quizzes, articles).

---

## User Roles

| Role | Scope |
|------|-------|
| `SUPER_ADMIN` | Full access across all companies and global data |
| `COMPANY_ADMIN` | Full access within own company |
| `EMPLOYEE` | Read-only access to own data (training, score, profile) |

---

## Key Design Decisions

**JWT authentication.** Access tokens are short-lived; refresh tokens are blacklisted on logout. Unverified users (`is_verified=False`) cannot obtain tokens. Staff accounts (`is_staff=True`) bypass the verification check for admin convenience.

**Invitation-only employees.** Employees cannot self-register. A Company Admin sends a 7-day UUID invitation token. On acceptance the account activates immediately with `is_verified=True` — no separate email verification step.

**Denormalized campaign statistics.** `SimulationCampaign` caches `total_sent`, `total_opened`, `total_clicked`, `total_reported` on the model for instant reads. Updated atomically on every `TrackingEvent.save()` via `_update_simulation_stats()` and `_update_campaign_stats()`.

**Risk score signals.** Employee risk scores recalculate automatically through a Django `post_save` signal on `TrackingEvent` in `training/signals.py`. The signal fires after `super().save()` and before the inline stat methods.

**Non-blocking email delivery.** All email dispatch is wrapped in try/except. Failures are logged (`logger.error`) but never raised to the caller, so email infrastructure issues can't break registration or invitation flows.

**Lazy-loaded ML models.** LSTM weights load once on first AI generation request, guarded by a threading lock, so the server boots instantly and the ~200 MB model memory is only paid when needed.

---

## Email Templates

Branded HTML templates live in [apps/core/templates/emails/](apps/core/templates/emails/):

| Template | Trigger |
|----------|---------|
| `verification.html` | User registration |
| `invitation.html` | Employee invited by admin |
| `password_reset.html` | Password reset request |
| Company welcome (inline) | Company Admin verifies email |
| Password changed (inline) | Password change confirmation |

Test email delivery end-to-end:

```bash
python manage.py test_email --to you@example.com --type all
# --type options: all | verification | invitation | password_reset
```

---

## AI Email Generation

Two in-house LSTM models generate phishing and legitimate emails on demand — English and Arabic. Used to produce campaign content that isn't repetitive across simulations.

| Detail | Value |
|--------|-------|
| Architecture | 3-layer LSTM, 256 embedding, 512 hidden, 0.3 dropout |
| EN training set | 14,000 samples, final loss 0.265 |
| AR training set | 10,000 samples, final loss 0.342 |
| EN vocabulary | 3,982 tokens |
| AR vocabulary | 3,429 tokens |
| Max sequence | 150 tokens (EN) / 120 tokens (AR) |
| Labels | `[LEGIT]`, `[PHISH]` |

Entry point: `EmailGenerator.generate_email(email_type, language)` in [ml_models/email_generator.py](ml_models/email_generator.py). Keyword-aware sender selection ensures brand impersonation emails (PayPal, Al Rajhi, Absher, etc.) get matching sender addresses rather than generic ones.

---

## Seeded Data

| Command | What it creates |
|---------|----------------|
| `seed_simulation_templates` | 15 phishing templates — 8 EN + 7 AR — covering link manipulation, credential harvesting, urgency scams, authority impersonation, and business email compromise |
| `seed_training` | 3 modules (Email Security, Mobile Security, Social Engineering), each with 5 bilingual quiz questions |

---

## Management Commands

| Command | Purpose |
|---------|---------|
| `python manage.py test_email` | Send test emails of each type |
| `python manage.py seed_simulation_templates` | Seed the 15 global phishing templates |
| `python manage.py seed_training` | Seed the 3 training modules + questions |
| `python manage.py clean_training` | Remove seeded training data (reset) |
| `python manage.py send_training_reminders` | Trigger scheduled reminder notifications |
| `python manage.py audit_notifications` | Audit the notification system for orphans |
| `python manage.py test_notifications` | Fire sample notifications across all 36 types |

---

## Notification Types (36 total)

| Audience | Categories |
|----------|-----------|
| Employee — Training (7) | assigned, due soon, due tomorrow, overdue, completed, quiz passed, quiz failed |
| Employee — Simulation (4) | link clicked, email reported, campaign launched, expired safe |
| Employee — Account (5) | welcome, profile updated, password changed, score up, score down |
| Admin — Employee actions (6) | employee clicked, reported, training completed, failed quiz, multiple failures, high risk |
| Admin — Campaign (5) | campaign completed, progress update, high click rate, low report rate, emails sent |
| Admin — Training (3) | deadline approaching, overdue alert, monthly report ready |
| Admin — Staff (2) | employee joined, invitation expired |
| Super Admin (3) | new company registered, system alert, backup completed |

---

## API Documentation

- Swagger UI: `http://localhost:8000/api/docs/`
- ReDoc: `http://localhost:8000/api/redoc/`
