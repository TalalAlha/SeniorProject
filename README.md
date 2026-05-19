# PhishAware 🎣

> **Train your team before attackers do.**
> A full-stack cybersecurity awareness platform with real phishing simulations, AI-generated emails, gamified training, and dashboards that tell you exactly who clicked.

---

## The Team

- **Emad Saeed Alzahrani**
- **Talal Abid Alharbi**
- **Thamer Musaad Alkhatheri**

---

## What is PhishAware?

PhishAware is a multi-tenant cybersecurity awareness SaaS. Company admins register on the platform, invite their employees, then run the full security awareness lifecycle: launch phishing simulations using real emails with pixel and link tracking, run quiz-based awareness campaigns, assign targeted training modules based on each employee's risk score, and track everything through live analytics dashboards. Employees earn badges, accumulate points, and compete on a leaderboard — because the only way to get people to care about security is to make it interesting. The whole platform is fully bilingual in English and Arabic with proper RTL support throughout.

---

## Repo Layout

```
PhishAware/
├── Backend/    — Django REST API, LSTM models, email system
└── Frontend/   — React 19 SPA, role-based routing, bilingual UI
```

---

## Features

### 🎯 Phishing Simulations — The Flagship
This is the whole point. Build a campaign, upload your employee CSV, and PhishAware sends *real* phishing emails through SendGrid. Every email contains an invisible tracking pixel and a lure link. When an employee opens the email, clicks the link, or reports it as suspicious — we know. Stats update in real time via Django post_save signals. And when an employee does click? They land on a custom **"You got caught"** page that explains exactly which red flags they missed. Education at the moment of failure, not three weeks later in a boring seminar.

### 🤖 AI Email Generation — The Plot Twist
PhishAware ships with **two custom-trained LSTM models** — one for English, one for Arabic. Not a GPT wrapper. Not a prompt template. A real from-scratch PyTorch architecture (~3 layers, 512 hidden units) trained on 14,000 English and 10,000 Arabic phishing and legitimate emails. The models generate brand-new, realistic phishing email content on demand via the `/api/v1/assessments/` endpoint. Building this from scratch, for Arabic specifically, is something almost no student project has ever done.

### 📋 Awareness Campaigns
Quiz-based email classification campaigns. Employees receive real email samples and have to label each one: phishing or legitimate? Each question is scored, results are tracked, and the data feeds into the employee's risk profile. This is how you build genuine intuition, not checkbox compliance.

### 📚 Training & Remediation
Three bilingual training modules: Email Security, Mobile Security, and Social Engineering. Each module has interactive content and a quiz at the end. The system auto-assigns modules based on risk score — employees who fail simulations or score poorly in campaigns get remediation training automatically. No manual intervention needed.

### 📊 Risk Scoring
Every employee has a dynamic risk score computed from three inputs: simulation behavior (did they click? report? ignore?), quiz performance, and training completion. Scores are recalculated in real time via Django `post_save` signals. The system maintains a historical timeline so admins can see whether employees are actually improving.

### 📈 Analytics
Company admins get dashboards with open rates, click rates, report rates, and risk trends across 7-day, 30-day, and 90-day windows. Platform admins see aggregate stats across all companies. Everything is exportable to CSV.

### 🏆 Gamification
Badges. Points. Leaderboards. Employees earn rewards for completing training, reporting phishing attempts, and improving their risk scores. Because the security tool that nobody uses is useless.

### 🔔 Notifications
36 distinct event types trigger in-app notifications — simulation sends, quiz completions, badge awards, training assignments, and more. Everyone stays informed without constant email noise.

### 🌐 Community Portal
A fully public section of the platform — no account required. Features a Daily Phishing Challenge, MENA Threat Watch, URL Inspector, Security Glossary, and curated Trusted Resources. Good for the broader community, good for SEO, and a great way to demo the platform without a login.

### 📧 Employee Invitation System
Admins invite employees by email. The invitation link is valid for 7 days, leads to a branded accept page, and activates the account on the spot — no separate email verification step needed. Built with a clean token-based flow that handles expiry gracefully.

### ✉️ Email Verification
Registration triggers a verification email via SendGrid. Unverified accounts are blocked from logging in with a clear amber banner and a one-click resend option. Staff accounts bypass verification automatically.

### 🌍 Bilingual / RTL
Every page, every role, every feature — in English and Arabic. The frontend auto-flips to RTL layout when Arabic is selected. This was not an afterthought; it was designed in from day one.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.11, Django 5.x, Django REST Framework |
| Auth | SimpleJWT |
| AI / ML | PyTorch (custom LSTM, EN + AR) |
| Frontend | React 19, Vite 7, React Router 6 |
| Styling | Tailwind CSS 3 |
| Charts | Recharts |
| i18n | i18next |
| Email | SendGrid SMTP relay |
| Database | SQLite (dev) / PostgreSQL-ready (prod) |
| API Docs | drf-yasg (Swagger + ReDoc) |

---

## Quick Start

The setup guides live in their respective directories:

- **Backend setup** → [Backend/README.md](Backend/README.md)
- **Frontend setup** → [Frontend/README.md](Frontend/README.md)

---

## About This Project

PhishAware was built as a senior capstone project at [University Name] by Emad, Talal, and Thamer. The scope — a full SaaS platform with custom-trained neural networks, a real email dispatch system, and a bilingual React frontend — is what happens when a team decides the bar should be higher than "it works on localhost."

If you made it this far, consider starring the repo. It means a lot to the engineers who built it. ⭐
