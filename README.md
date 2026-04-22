# PhishAware

A multi-tenant cybersecurity awareness platform that protects organizations from phishing attacks through AI-generated simulations, targeted training, and continuous risk scoring.

Senior Project — 2025/2026 — **Talal · Emad · Thameer**

---

## Overview

PhishAware lets company administrators launch realistic phishing simulation campaigns, assess employee awareness through classification quizzes, assign remediation training based on risk, and track security posture through real-time analytics. The platform is fully bilingual (English + Arabic with RTL support), multi-tenant, and powered by a pair of in-house LSTM models that generate phishing and legitimate emails on demand.

---

## Repository Layout

```
SeniorProject/
├── Backend/        Django REST Framework API + PyTorch ML models
├── Frontend/       React 19 + Vite SPA
└── README.md
```

The frontend consumes the backend exclusively through a versioned REST API (`/api/v1/...`) secured with JWT access + refresh tokens.

---

## Core Capabilities

### Phishing Simulations
- Launch campaigns using seeded templates **or** generate fresh emails with the trained LSTM model (English + Arabic)
- Dispatch real emails via SendGrid SMTP relay
- Track pixel opens, lure-link clicks, credential submissions, and employee "report phishing" actions
- Educational landing page shows the red flags an employee missed after a click

### Awareness Campaigns
- Quiz-based classification exercises where employees label emails as phishing or legitimate
- Per-question scoring with full breakdown on completion
- Admin statistics: completion rate, average score, risk distribution

### Training & Remediation
- 3 seeded bilingual modules (Email Security, Mobile Security, Social Engineering), each with a 5-question quiz
- Individual or bulk assignment with due dates and overdue tracking
- Quiz results automatically update the employee's risk score

### Risk Scoring
- Per-employee score recalculated via Django `post_save` signals on every tracking event
- Inputs: simulation behavior, quiz performance, training completion
- Historical score timeline preserved

### Analytics
- Company and platform overview dashboards
- Time-series trends (7d / 30d / 90d)
- Risk distribution, high-risk employee lists, training effectiveness
- CSV export

### Gamification
- Badge catalog with automatic + bulk-admin award flows
- Points ledger with user summary and transaction history
- Company leaderboard with filtering by period

### Notifications
- 36 platform events surfaced in-app: training deadlines, simulation actions, score changes, admin alerts, new company registrations, and more

### Public Community Portal
- Authless training topics, public quiz, and resources at the root domain

---

## Tech Stack

| Layer | Stack |
|-------|-------|
| Backend | Python 3.11+, Django 5.x, Django REST Framework 3.x, SimpleJWT |
| AI | PyTorch 2.x, custom LSTM (3-layer, 512 hidden, 256 embedding) |
| Database | SQLite (development) · PostgreSQL-ready (production) |
| Email | SendGrid via Django SMTP backend |
| API Docs | drf-yasg (Swagger UI + ReDoc) |
| Frontend | React 19, Vite 7, React Router 6 |
| Styling | Tailwind CSS 3 |
| Charts | Recharts |
| i18n | i18next + react-i18next (English + Arabic, RTL-aware) |
| HTTP | Axios with JWT refresh interceptor |

---

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- A SendGrid account with a verified sender (optional for local dev — emails will still log)

### Backend

```bash
cd Backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
pip install torch                 # Required for AI email generation
```

Create `Backend/.env`:

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

Migrate, seed, and run:

```bash
python manage.py migrate
python manage.py seed_simulation_templates   # 15 templates (8 EN + 7 AR)
python manage.py seed_training               # 3 bilingual training modules
python manage.py createsuperuser             # Super Admin account
python manage.py runserver
```

Backend: `http://localhost:8000` · API: `http://localhost:8000/api/v1/` · Docs: `http://localhost:8000/api/docs/`

### Frontend

```bash
cd Frontend
npm install
```

Create `Frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

```bash
npm run dev
```

Frontend: `http://localhost:5173`

---

## User Roles

| Role | Scope |
|------|-------|
| `SUPER_ADMIN` | Platform-wide: all companies, global templates, platform analytics |
| `COMPANY_ADMIN` | Own company only: employees, simulations, campaigns, training, analytics |
| `EMPLOYEE` | Self-service: training, quizzes, risk score, badges, leaderboard |

Employees are invitation-only — admins send a 7-day UUID token via email; the account activates on acceptance (verification is skipped because the invite itself proves email ownership).

---

## API Surface

All endpoints live under `/api/v1/`:

| Prefix | Purpose |
|--------|---------|
| `/auth/` | Register, login, token refresh, email verification, password reset, profile |
| `/employees/` | Invite, list pending, resend, cancel, accept invitation |
| `/companies/` | Registration, stats, users, CSV import, activate/deactivate |
| `/campaigns/` | Awareness campaigns and employee classification quizzes |
| `/assessments/` | Reusable email templates + **AI email generation** |
| `/simulations/` | Templates, campaigns, send, tracking (link, report, credentials, feedback) |
| `/training/` | Modules, assignments, quizzes, risk scores |
| `/gamification/` | Badges, points, leaderboard |
| `/analytics/` | Dashboard, trends, risk analytics, CSV export |
| `/notifications/` | User notification feed |
| `/community/` | Public community portal (no auth) |

Full endpoint reference: [Backend/README.md](Backend/README.md)

---

## Project Structure

```
Backend/
├── apps/
│   ├── accounts/        Auth, registration, invitations, password reset
│   ├── assessments/     Email templates + AI email generation endpoint
│   ├── analytics/       Dashboards, trends, risk analytics, CSV export
│   ├── campaigns/       Awareness campaigns and classification quizzes
│   ├── community/       Public community portal
│   ├── companies/       Company CRUD, users, CSV import
│   ├── core/            Shared permissions, email helpers, HTML templates
│   ├── gamification/    Badges, points, leaderboard
│   ├── notifications/   36-type notification system
│   ├── simulations/     Live phishing simulations and tracking
│   └── training/        Modules, quizzes, risk scores, assignments
├── ml_models/           LSTM phishing email generators (EN + AR, PyTorch)
├── phishaware_backend/  Django settings, root urls
├── requirements.txt
└── manage.py

Frontend/
├── src/
│   ├── api/             Axios client + endpoint definitions
│   ├── contexts/        AuthContext
│   ├── components/      Shared UI
│   ├── hooks/           Custom hooks
│   ├── i18n/            English + Arabic translations
│   ├── layouts/         DashboardLayout, PublicLayout
│   ├── pages/           auth, public, employee, company, admin
│   ├── routes/          React Router + role guards
│   └── utils/
├── public/
└── package.json
```

---

## AI Email Generation

Two LSTM models (one English, one Arabic) generate phishing and legitimate emails on demand.

- Location: [Backend/ml_models/](Backend/ml_models/)
- Trained weights: `phishing_lstm_en.pth` (14k samples), `phishing_lstm_ar.pth` (10k samples)
- Vocabularies: `vocab_en.json`, `vocab_ar.json`
- Architecture: 3-layer LSTM, 256 embedding, 512 hidden, 0.3 dropout
- Entry point: `EmailGenerator.generate_email(email_type, language)` in [email_generator.py](Backend/ml_models/email_generator.py)
- Exposed via `POST /api/v1/assessments/ai/generate-emails/`

Models are loaded lazily (thread-safe singleton) on the first request.

---

## Useful Management Commands

```bash
# Test all email templates end-to-end
python manage.py test_email --to you@example.com --type all

# Trigger scheduled training reminder notifications
python manage.py send_training_reminders

# Audit the notification system
python manage.py audit_notifications

# Reset training data
python manage.py clean_training
```

---

## License

Academic senior project — all rights reserved by the authors.