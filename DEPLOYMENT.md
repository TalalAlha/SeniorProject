# PhishAware — Deployment Guide

## Overview

PhishAware has two independently deployable parts:

| Part | Stack | Default dev port |
|------|-------|-----------------|
| **Backend** | Django 4 + PostgreSQL | `8000` |
| **Frontend** | React 18 + Vite | `5173` |

---

## Prerequisites

| Tool | Minimum version |
|------|----------------|
| Python | 3.10+ |
| Node.js | 18+ |
| npm | 9+ |
| PostgreSQL | 14+ (production) |
| Git | any |

---

## 1. Clone the Repository

```bash
git clone <repo-url>
cd SeniorProject
```

---

## 2. Backend Setup

### 2.1 Create a virtual environment

```bash
cd Backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate
```

### 2.2 Install dependencies

```bash
pip install -r requirements.txt
```

### 2.3 Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Django
SECRET_KEY=<generate with: python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())">
DEBUG=True                          # Set to False in production
ALLOWED_HOSTS=localhost,127.0.0.1   # Add your production domain

# Database — leave commented for SQLite (development), uncomment for PostgreSQL
# DB_ENGINE=django.db.backends.postgresql
# DB_NAME=phishaware_db
# DB_USER=your_db_user
# DB_PASSWORD=your_db_password
# DB_HOST=localhost
# DB_PORT=5432

# SendGrid (email delivery)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=SG.your-sendgrid-api-key
DEFAULT_FROM_EMAIL=PhishAware <noreply@yourdomain.com>
SENDGRID_VERIFIED_SENDER=noreply@yourdomain.com

# Frontend origin — used in email links
FRONTEND_URL=http://localhost:5173
```

> **Development shortcut:** To skip SendGrid and print emails to the terminal instead:
> ```env
> EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
> ```

### 2.4 Apply migrations

```bash
python manage.py migrate
```

### 2.5 Seed initial data

```bash
# Phishing simulation templates (15 templates: 8 EN + 7 AR)
python manage.py seed_simulation_templates

# Training modules and quiz questions (3 modules, 5 bilingual questions each)
python manage.py seed_training
```

### 2.6 Create a super-admin account

```bash
python manage.py createsuperuser
```

### 2.7 Start the development server

```bash
python manage.py runserver
```

The API will be available at `http://localhost:8000/api/v1/`.

---

## 3. Frontend Setup

### 3.1 Install dependencies

```bash
cd Frontend
npm install
```

### 3.2 Configure environment variables

Create a `.env` file in `Frontend/`:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

> In production, replace with your deployed backend URL.

### 3.3 Start the development server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## 4. Test the Email System

After configuring SendGrid, verify all email types work:

```bash
# Test all email templates
python manage.py test_email --to your@email.com --type all

# Test individual types
python manage.py test_email --to your@email.com --type verification
python manage.py test_email --to your@email.com --type invitation
python manage.py test_email --to your@email.com --type password_reset
```

---

## 5. Production Checklist

### Backend

- [ ] Set `DEBUG=False` in `.env`
- [ ] Set `ALLOWED_HOSTS` to your production domain
- [ ] Use PostgreSQL (uncomment DB settings in `.env`)
- [ ] Run `python manage.py collectstatic` and serve static files via nginx/whitenoise
- [ ] Set a strong `SECRET_KEY` (never reuse the development key)
- [ ] Configure a production WSGI server (gunicorn recommended):
  ```bash
  gunicorn config.wsgi:application --bind 0.0.0.0:8000
  ```
- [ ] Set up HTTPS (required for JWT cookies and SendGrid delivery)
- [ ] Verify SendGrid sender domain to avoid spam filters

### Frontend

- [ ] Set `VITE_API_BASE_URL` to the production backend URL
- [ ] Build for production:
  ```bash
  npm run build
  ```
  Output goes to `dist/` — serve with nginx or deploy to a static host (Vercel, Netlify, etc.)
- [ ] Ensure the frontend domain is added to `CORS_ALLOWED_ORIGINS` in the backend `.env`

---

## 6. Environment Variables Reference

### Backend (`.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `SECRET_KEY` | Yes | Django secret key for cryptographic signing |
| `DEBUG` | Yes | `True` for development, `False` for production |
| `ALLOWED_HOSTS` | Yes | Comma-separated list of allowed hostnames |
| `DB_ENGINE` | No | Database engine (defaults to SQLite if omitted) |
| `DB_NAME` | No | PostgreSQL database name |
| `DB_USER` | No | PostgreSQL username |
| `DB_PASSWORD` | No | PostgreSQL password |
| `DB_HOST` | No | PostgreSQL host (default: `localhost`) |
| `DB_PORT` | No | PostgreSQL port (default: `5432`) |
| `EMAIL_BACKEND` | Yes | Use `smtp.EmailBackend` (prod) or `console.EmailBackend` (dev) |
| `EMAIL_HOST_PASSWORD` | Yes | SendGrid API key (starts with `SG.`) |
| `DEFAULT_FROM_EMAIL` | Yes | From address shown in sent emails |
| `SENDGRID_VERIFIED_SENDER` | Yes | Must match a verified sender in your SendGrid account |
| `FRONTEND_URL` | Yes | Used to build links in verification and invitation emails |

### Frontend (`Frontend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_BASE_URL` | Yes | Base URL of the Django API (e.g., `http://localhost:8000/api/v1`) |

---

## 7. User Roles and Access

| Role | Registration Method | Default Landing Page |
|------|--------------------|--------------------|
| `SUPER_ADMIN` | `createsuperuser` command | `/admin/dashboard` |
| `COMPANY_ADMIN` | `/register-company` page | `/company/dashboard` |
| `EMPLOYEE` | Email invitation from company admin | `/employee/dashboard` |
| `PUBLIC_USER` | `/register` page | `/` (community portal) |

---

## 8. Common Issues

**CORS errors in browser**
Ensure `CORS_ALLOWED_ORIGINS` in `.env` includes the frontend origin exactly (e.g., `http://localhost:5173`).

**Emails not sending**
- Check `EMAIL_HOST_PASSWORD` starts with `SG.`
- Verify the sender in SendGrid dashboard matches `SENDGRID_VERIFIED_SENDER`
- Try `console.EmailBackend` to confirm the email content is generated correctly

**`ModuleNotFoundError` on startup**
Run `pip install -r requirements.txt` inside the activated virtual environment.

**Frontend shows blank page after build**
Check `VITE_API_BASE_URL` is set correctly and the backend's `ALLOWED_HOSTS` includes the frontend's domain.
