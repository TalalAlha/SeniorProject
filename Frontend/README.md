# PhishAware — Frontend

React 19 + Vite SPA for the PhishAware cybersecurity awareness platform — role-based routing across four user types, JWT auth with automatic token refresh, full bilingual support with Arabic RTL, and live simulation analytics that update in real time.

---

## Tech Stack

| Technology | Purpose |
|---|---|
| React 19 | UI framework |
| Vite 7 | Build tool + dev server |
| React Router 6 | Client-side routing (`createBrowserRouter`) |
| Tailwind CSS 3 | Utility-first styling |
| Axios | HTTP client + JWT interceptors |
| Recharts | Analytics charts |
| Lucide React | Icon set |
| i18next | Internationalization (EN + AR) |
| react-hot-toast | Toast notifications |
| date-fns | Date formatting |

---

## Project Structure

```
Frontend/
├── src/
│   ├── api/
│   │   ├── axios.js           — Axios instance + JWT interceptors + auto-refresh
│   │   ├── endpoints.js       — all API functions grouped by resource
│   │   ├── notifications.js   — notification helpers
│   │   └── index.js
│   ├── contexts/
│   │   └── index.jsx          — AuthContext, USER_ROLES, login/logout
│   ├── routes/
│   │   ├── index.jsx          — createBrowserRouter config
│   │   └── ProtectedRoute.jsx — ProtectedRoute, PublicRoute, GuestRoute guards
│   ├── layouts/
│   │   ├── DashboardLayout.jsx  — sidebar + topbar for authenticated pages
│   │   └── PublicLayout.jsx     — navbar + footer for public pages
│   ├── pages/
│   │   ├── auth/         — Login, RegisterCompany, VerifyEmail, AcceptInvitation,
│   │   │                   ForgotPassword, ResetPassword
│   │   ├── public/       — LandingPage, PublicHome, TrainingTopics, TopicTraining,
│   │   │                   PublicQuiz, CommunityPortal, SimulationCaught,
│   │   │                   Unauthorized, NotFound
│   │   ├── employee/     — Dashboard, Quizzes, TakeQuiz, Training, TakeTraining,
│   │   │                   Badges, Leaderboard, Profile
│   │   ├── company/      — Dashboard, Campaigns, CampaignCreate, CampaignDetails,
│   │   │                   Simulations, SimulationCreate, SimulationAnalytics,
│   │   │                   Employees, Training, Analytics, Profile
│   │   └── admin/        — Dashboard, CompanyList, CompanyCreate,
│   │                       PlatformAnalytics, UserManagement
│   ├── components/       — shared UI: NotificationDropdown, PasswordRequirements,
│   │                       Logo, common/, training/
│   ├── hooks/            — custom React hooks
│   ├── i18n/             — English + Arabic translation files
│   ├── utils/            — shared helpers
│   └── main.jsx
├── public/
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Create a `.env` file inside `Frontend/`:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

### 3. Run

```bash
npm run dev
```

The dev server starts at `http://localhost:5173`. The backend must also be running — see [Backend/README.md](../Backend/README.md).

---

## Role-Based Routing

The app serves four distinct user types, each with their own set of routes and UI. Route guards are enforced by `ProtectedRoute`, `PublicRoute`, and `GuestRoute` components in `src/routes/ProtectedRoute.jsx`.

### 🔴 ADMIN — Platform superuser
Full visibility across all companies on the platform.
- Company list and creation
- Platform-wide analytics
- User management

### 🟠 COMPANY — Company administrator
Runs the full security awareness lifecycle for their organization.
- Company dashboard with risk and engagement stats
- Phishing simulation campaigns — create, send, and view analytics
- Awareness campaigns — create and track quiz-based campaigns
- Employee management — invite, view, and monitor employees
- Training management — assign modules, track completion
- Analytics — 7d / 30d / 90d trend views, CSV export
- Profile management

### 🟢 EMPLOYEE — End user
The person actually getting trained.
- Personal dashboard with risk score and recent activity
- Quizzes — take awareness campaign quizzes
- Training — view assigned and optional modules
- Badges — view earned badges and points history
- Leaderboard — compete with colleagues
- Profile management

### 🌐 Public / Guest — No auth required
- Landing page
- Community Portal (Daily Phishing Challenge, MENA Threat Watch, URL Inspector, Security Glossary, Trusted Resources)
- Training Topics and Public Quiz
- SimulationCaught — the page employees land on after clicking a phishing link

---

## Auth Flow

Authentication is JWT-based with automatic token management:

- **Storage**: Access token + refresh token stored in `localStorage`
- **Auto-refresh**: The Axios instance in `src/api/axios.js` intercepts 401 responses, silently requests a new access token using the refresh token, and retries the original request — no visible interruption to the user
- **Context**: `AuthContext` (in `src/contexts/index.jsx`) provides the current user object, role, and `login`/`logout` functions app-wide via React context
- **Email verification gate**: Unverified accounts are blocked from logging in; the login page shows an amber banner with a one-click resend option
- **Invitation accept flow**: `/accept-invitation/:token` is a public route — employees can activate their accounts without being logged in first

---

## Key Pages

### SimulationCaught — `/simulation/caught/:token`
The most important page in the app. When an employee clicks a phishing link in a simulation email, they land here instead of wherever the link pretended to go. The page fetches the feedback for that specific simulation link and shows the employee every red flag they missed, with a plain-language explanation of why each one was suspicious. Education at the moment of failure — not in a compliance training three weeks later.

### SimulationAnalytics
The live operations center for a phishing campaign. Shows real-time open rate, click rate, and report rate with per-employee detail. **Auto-refreshes every 15 seconds** so admins watching a live campaign don't need to reload. Charts built with Recharts.

### TakeQuiz
The awareness campaign experience. Employees are shown email samples one at a time and classify each as phishing or legitimate. Timed, scored per question, and feeds directly into the employee's risk profile. Designed to build genuine intuition, not just click through a checklist.

### CommunityPortal
The public face of the platform. No login required. Features:
- **Daily Phishing Challenge** — a fresh example to spot every day
- **MENA Threat Watch** — regional threat intelligence and news
- **URL Inspector** — analyze suspicious links without clicking them
- **Security Glossary** — plain-English definitions for security terms
- **Trusted Resources** — curated links to reputable security organizations

---

## Bilingual / RTL

Every page, every role, every feature is available in English and Arabic. Language switching is handled by i18next. When Arabic is selected:

- The UI direction flips to RTL automatically
- All text strings load from the Arabic translation files in `src/i18n/`
- Layout, flex direction, icon placement, and text alignment all respond to the RTL context

Arabic was not bolted on after the fact. The component structure was designed to support bidirectionality from the start.

---

## Built by

**Emad Saeed Alzahrani · Talal Abid Alharbi · Thamer Musaad Alkahtani**

Senior capstone project, 2025–2026.

If the UI made you want to build something similar, the least you can do is star the repo. ⭐
