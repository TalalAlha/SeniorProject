<div align="center">

# 🐍 PhishAware — Backend

### *The brains behind the phish.*

Django REST API · Custom LSTMs · Real email dispatch · 36-type notifications

![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white)
![Django](https://img.shields.io/badge/Django-5.x-092E20?logo=django&logoColor=white)
![DRF](https://img.shields.io/badge/DRF-API-red)
![PyTorch](https://img.shields.io/badge/PyTorch-LSTM-EE4C2C?logo=pytorch&logoColor=white)
![SendGrid](https://img.shields.io/badge/SendGrid-Email-1A82E2?logo=sendgrid&logoColor=white)

</div>

---

## ⚡ Quick Start

```bash
# 1. Virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
source venv/bin/activate       # macOS / Linux

# 2. Dependencies (PyTorch installed separately — see note below)
pip install -r requirements.txt
pip install torch

# 3. Migrate + seed + run
python manage.py migrate
python manage.py seed_simulation_templates   # 8 EN + 7 AR templates
python manage.py seed_training               # 3 bilingual modules
python manage.py createsuperuser
python manage.py runserver
```

> 💡 **Why is PyTorch separate?** The right wheel (CPU vs CUDA) depends on your machine.
> Grab the correct command from [pytorch.org/get-started/locally](https://pytorch.org/get-started/locally).

---

## 🔐 Environment (`.env`)

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

📬 **Test it:** `python manage.py test_email --to you@example.com --type all`

---

## 📁 Project Layout

```
Backend/
├── apps/
│   ├── 🔐 accounts/      Auth · email verification · invitations · password reset
│   ├── 🤖 assessments/   Email library + AI email generation endpoint
│   ├── 📊 analytics/     Dashboards · trends · CSV export
│   ├── 📋 campaigns/     Awareness quiz campaigns
│   ├── 🌐 community/     Public portal (no auth)
│   ├── 🏢 companies/     Company CRUD · CSV import
│   ├── ⚙️  core/          Shared permissions · email helpers
│   ├── 🏆 gamification/  Badges · points · leaderboard
│   ├── 🔔 notifications/ 36-type in-app system
│   ├── 🎣 simulations/   Live phishing · click & report tracking
│   └── 📚 training/      Modules · risk scores · remediation
└── 🧠 ml_models/
    ├── phishing_lstm_en.pth   14k email dataset
    ├── phishing_lstm_ar.pth   10k email dataset
    └── email_generator.py     Public API
```

---

## 📡 API Reference

Spin up the server and open:

- 🟢 **Swagger UI** → `http://localhost:8000/swagger/`
- 📕 **ReDoc** → `http://localhost:8000/redoc/`

| Group | Base Path | What it does |
|---|---|---|
| 🔐 Auth | `/api/v1/auth/` | Login · register · refresh · verify · reset |
| 👤 Employees | `/api/v1/employees/` | Invite · accept invitation |
| 🏢 Companies | `/api/v1/companies/` | CRUD · CSV import |
| 🎣 Simulations | `/api/v1/simulations/` | Send · track · feedback |
| 📋 Campaigns | `/api/v1/campaigns/` | Quizzes · scoring |
| 📚 Training | `/api/v1/training/` | Modules · risk scores |
| 📊 Analytics | `/api/v1/analytics/` | Dashboards · trends · CSV |
| 🏆 Gamification | `/api/v1/gamification/` | Badges · leaderboard |
| 🔔 Notifications | `/api/v1/notifications/` | List · mark read |
| 🌐 Community | `/api/v1/community/` | Public portal |
| 🤖 Assessments / AI | `/api/v1/assessments/` | AI email generation |

---

## 🧠 The LSTM Models

> The part that doesn't belong in most student projects — but it's here.

| Model | Language | Dataset | Architecture |
|---|---|---|---|
| `phishing_lstm_en.pth` | 🇬🇧 English | ~14,000 emails | 3-layer LSTM · 512 hidden |
| `phishing_lstm_ar.pth` | 🇸🇦 Arabic | ~10,000 emails | 3-layer LSTM · 512 hidden |

Built from scratch in PyTorch. Not a GPT wrapper. Custom architecture, training loop, tokenization, and vocabulary — for Arabic too, RTL script and all.

```python
from ml_models.email_generator import EmailGenerator

gen = EmailGenerator(language='en')   # or 'ar'
email = gen.generate_email(seed_text="Your account has been", temperature=0.8)
```

Live endpoint: `POST /api/v1/assessments/generate/` (auth required).

---

## 🎣 How a Simulation Works

```
1. 📝 Admin creates campaign + uploads employee CSV
2. 📤 Send → SendGrid dispatches per-employee email containing:
        🔍 invisible 1×1 tracking pixel  (open)
        🔗 unique-token lure link        (click)
3. 👀 Open       → TrackingEvent(OPEN)
4. 🖱️  Click     → TrackingEvent(CLICK) → /simulation/caught/:token
5. 🚨 Report     → TrackingEvent(REPORT)
6. ⚡ Every save fires:
        🧠 post_save → risk score recalculated
        📊 inline    → denormalized stats on SimulationCampaign
```

Stats live denormalized on `SimulationCampaign` for fast reads. Rate properties guard against `total_sent=0`.

---

## 📈 Risk Scoring

Every employee gets a `RiskScore` recalculated on every `TrackingEvent.save()` via `training/signals.py`.

| Input | Question it answers |
|---|---|
| 🎣 Simulation behavior | Did they open · click · report? |
| 📋 Quiz performance | How many emails classified correctly? |
| 📚 Training completion | How many assigned modules finished? |

Historical timeline kept so admins see actual improvement over time.

---

<div align="center">

**Emad Alzahrani · Talal Alharbi · Thamer Alkahtani**
*Senior capstone — 2025–2026* · ⭐
</div>
