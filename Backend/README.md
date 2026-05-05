# PhishAware — Backend

Django REST Framework API powering a multi-tenant cybersecurity awareness platform — phishing simulations, AI email generation, risk scoring, gamification, and a 36-type notification system, all in one bilingual service.

---

## Tech Stack

| Technology | Purpose |
|---|---|
| Python 3.11 | Runtime |
| Django 5.x | Web framework |
| Django REST Framework | API layer |
| SimpleJWT | JWT authentication |
| PyTorch | Custom LSTM models (EN + AR) |
| SendGrid | Transactional email (SMTP relay) |
| drf-yasg | Swagger + ReDoc API docs |
| SQLite / PostgreSQL | Database (SQLite dev, PG-ready for prod) |
| python-decouple | Environment variable management |

---

## Project Structure

```
Backend/
├── apps/
│   ├── accounts/      — auth, registration, email verification, invitations, password reset
│   ├── assessments/   — email template library + AI email generation endpoint
│   ├── analytics/     — dashboard stats, trends, risk analytics, CSV export
│   ├── campaigns/     — awareness campaigns: email classification quizzes, scoring
│   ├── community/     — public community portal (no auth required)
│   ├── companies/     — company CRUD, user management, CSV import
│   ├── core/          — shared permissions, email helpers, HTML email templates
│   ├── gamification/  — badges, points ledger, leaderboard
│   ├── notifications/ — 36-type in-app notification system
│   ├── simulations/   — live phishing simulations: email dispatch, click/report tracking
│   └── training/      — modules, quizzes, risk scores, remediation assignments
├── ml_models/
│   ├── email_generator.py     — public API: EmailGenerator.generate_email()
│   ├── lstm_model.py          — model architecture
│   ├── vocabulary.py          — tokenization
│   ├── phishing_lstm_en.pth   — trained EN weights (14k dataset)
│   ├── phishing_lstm_ar.pth   — trained AR weights (10k dataset)
│   ├── vocab_en.json
│   ├── vocab_ar.json
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
source venv/bin/activate   # Windows: venv\Scripts\activate
```

### 2. Dependencies

```bash
pip install -r requirements.txt
pip install torch   # NOT in requirements.txt — CPU/CUDA build varies by host
```

> PyTorch is intentionally excluded from `requirements.txt` because the correct build (CPU vs. CUDA, platform-specific wheels) depends on your machine. See [pytorch.org/get-started/locally](https://pytorch.org/get-started/locally) for the right install command.

### 3. Environment variables

Create a `.env` file inside `Backend/`:

```env
SECRET_KEY=your-django-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
FRONTEND_URL=http://localhost:5173

EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=your-sendgrid-api-key
DEFAULT_FROM_EMAIL=PhishAware <no-reply@yourdomain.com>
SENDGRID_VERIFIED_SENDER=no-reply@yourdomain.com
```

### 4. Migrate, seed, and run

```bash
python manage.py migrate

python manage.py seed_simulation_templates   # seeds 15 templates: 8 EN + 7 AR
python manage.py seed_training               # seeds 3 bilingual modules, 5 questions each

python manage.py createsuperuser
python manage.py runserver
```

### 5. Test the email system

```bash
python manage.py test_email --to email@example.com --type all
# --type options: all | verification | invitation | password_reset
```

---

## API Documentation

Once the server is running, full interactive docs are available at:

- **Swagger UI** → `http://localhost:8000/swagger/`
- **ReDoc** → `http://localhost:8000/redoc/`

### API Groups

| Group | Base Path | What it covers |
|---|---|---|
| Auth | `/api/v1/auth/` | Login, register, token refresh, verify email, resend verification, forgot/reset password |
| Employees | `/api/v1/employees/` | Invite employee, get invitation details, accept invitation |
| Companies | `/api/v1/companies/` | Company CRUD, user management, CSV import |
| Simulations | `/api/v1/simulations/` | Campaigns, email dispatch, tracking events, feedback |
| Campaigns | `/api/v1/campaigns/` | Awareness campaigns, quiz submissions, scoring |
| Training | `/api/v1/training/` | Modules, lessons, quizzes, risk scores, assignments |
| Analytics | `/api/v1/analytics/` | Company dashboards, platform stats, trends, CSV export |
| Gamification | `/api/v1/gamification/` | Badges, points ledger, leaderboard |
| Notifications | `/api/v1/notifications/` | List, mark read, mark all read |
| Community | `/api/v1/community/` | Public portal content (no auth) |
| Assessments / AI | `/api/v1/assessments/` | Email template library, AI email generation |

---

## The LSTM Models

This is the part that doesn't belong in most student projects — but it's here.

PhishAware ships with **two custom-trained LSTM neural networks** built entirely from scratch in PyTorch:

| Model | Language | Training Data | Architecture |
|---|---|---|---|
| `phishing_lstm_en.pth` | English | ~14,000 emails | 3-layer LSTM, 512 hidden units |
| `phishing_lstm_ar.pth` | Arabic | ~10,000 emails | 3-layer LSTM, 512 hidden units |

The models generate brand-new phishing email content on demand. They are **not** wrappers around GPT or any commercial LLM — the architecture, training loop, tokenization, and vocabulary management are all custom code. Building a generative model for Arabic specifically, with proper tokenization for a right-to-left script, is not a trivial undertaking.

**Public API:**

```python
from ml_models.email_generator import EmailGenerator

generator = EmailGenerator(language='en')  # or 'ar'
email_text = generator.generate_email(seed_text="Your account has been", temperature=0.8)
```

The generation endpoint is exposed at `POST /api/v1/assessments/generate/` and requires authentication.

---

## Email System

All transactional emails route through SendGrid's SMTP relay. The helpers live in `apps/core/emails.py`:

| Helper | When it fires |
|---|---|
| `send_verification_email` | New user registration |
| `send_employee_invitation` | Admin invites an employee |
| `send_simulation_email` | Phishing simulation dispatch |
| `send_password_reset_email` | Forgot password request |

HTML templates are in `apps/core/templates/emails/` and use Django's template engine. The `TEMPLATES` configuration in `settings.py` includes `BASE_DIR / 'apps' / 'core' / 'templates'` so templates resolve correctly.

---

## Simulation Tracking Flow

This is how a phishing simulation works end-to-end:

```
1. Admin creates a SimulationCampaign and uploads employee CSV
2. Admin triggers send → _send_simulation_email() fires per employee
3. Email is dispatched via SendGrid containing:
   - An invisible 1×1 tracking pixel  →  fires on email open
   - A lure link with a unique token   →  fires on click
4. Employee opens email     → TrackingEvent(type='OPEN') saved
5. Employee clicks link     → TrackingEvent(type='CLICK') saved
                             → Employee redirected to /simulation/caught/:token
6. Employee reports email   → TrackingEvent(type='REPORT') saved
7. Each TrackingEvent.save() triggers:
   - post_save signal → risk score recalculated (training/signals.py)
   - _update_simulation_stats() → denormalized stats on SimulationCampaign
   - _update_campaign_stats()   → aggregate campaign stats
```

Stats are **denormalized** on `SimulationCampaign` (fields: `total_sent`, `total_opened`, `total_clicked`, `total_reported`) for fast reads. The rate properties guard against division by zero when `total_sent=0`.

---

## Risk Scoring

Every employee has a `RiskScore` record updated automatically via Django `post_save` signals defined in `training/signals.py`.

The score is a composite of three inputs:

| Input | Signal |
|---|---|
| Simulation behavior | Did the employee open, click, or report? |
| Campaign quiz performance | What percentage of emails did they classify correctly? |
| Training completion | How many assigned modules have they finished? |

`recalculate_score()` is called on every `TrackingEvent` save. It skips the simulation adjustment if `total_simulations_received=0` to avoid false-positive scores on fresh accounts. The system maintains a historical timeline so admins can see score trends over time.

---

## Built by

This backend was designed and built by:

**Emad Saeed Alzahrani · Talal Abid Alharbi · Thamer Musaad Alkahtani**

Senior capstone project, 2025–2026.

If the code helped you build something, a star on the repo is appreciated. ⭐
