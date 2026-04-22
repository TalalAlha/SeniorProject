# PhishAware — Frontend

React 19 + Vite single-page application for the PhishAware cybersecurity awareness platform. Role-based routing, JWT auth with automatic refresh, bilingual UI (English + Arabic with RTL), and live campaign analytics.

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Framework | React 19 |
| Build Tool | Vite 7 |
| Routing | React Router 6 (createBrowserRouter) |
| Styling | Tailwind CSS 3 |
| HTTP Client | Axios (with JWT refresh interceptor) |
| Charts | Recharts |
| Icons | Lucide React |
| i18n | i18next + react-i18next (English + Arabic, RTL-aware) |
| Toasts | react-hot-toast |
| Dates | date-fns |

---

## Project Structure

```
Frontend/
├── src/
│   ├── api/
│   │   ├── axios.js          Axios instance + JWT request/response interceptors
│   │   ├── endpoints.js      All API endpoint functions grouped by resource
│   │   ├── notifications.js  Notification-specific helpers
│   │   └── index.js          Re-exports
│   ├── contexts/
│   │   └── index.jsx         AuthContext, USER_ROLES, login/logout helpers
│   ├── routes/
│   │   ├── index.jsx         createBrowserRouter configuration
│   │   └── ProtectedRoute.jsx ProtectedRoute / PublicRoute / GuestRoute guards
│   ├── layouts/
│   │   ├── DashboardLayout.jsx  Sidebar + topbar shell for authenticated pages
│   │   └── PublicLayout.jsx     Navbar + footer shell for public pages
│   ├── pages/
│   │   ├── auth/             Login, RegisterCompany, VerifyEmail, AcceptInvitation, ForgotPassword, ResetPassword
│   │   ├── public/           PublicHome, TrainingTopics, TopicTraining, PublicQuiz, CommunityPortal, SimulationCaught, Unauthorized, NotFound
│   │   ├── employee/         Dashboard, Quizzes, TakeQuiz, Training, TakeTraining, Badges, Leaderboard, Profile
│   │   ├── company/          Dashboard, Campaigns, Simulations, SimulationAnalytics, Employees, Training, Analytics, Profile
│   │   └── admin/            Dashboard, CompanyList, CompanyCreate, PlatformAnalytics, UserManagement
│   ├── components/           Shared UI
│   ├── hooks/                Custom hooks
│   ├── i18n/                 English + Arabic translations
│   ├── utils/                Helpers
│   └── main.jsx              App entry
├── public/                   Static assets
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

### 2. Configure environment variables

Create `.env` in `Frontend/`:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

### 3. Run

```bash
npm run dev       # Dev server at http://localhost:5173
npm run build     # Production build → dist/
npm run preview   # Preview production build
npm run lint      # ESLint
```

---

## Routing

React Router 6 with three role-based route groups protected by `ProtectedRoute`. Guest routes redirect authenticated users to their role dashboard; public routes redirect authenticated users away from auth pages.

### Public routes (no auth)

| Path | Page | Description |
|------|------|-------------|
| `/` | PublicHome | Landing page |
| `/training` | TrainingTopics | Public cybersecurity topics |
| `/training/:topic` | TopicTraining | Topic content |
| `/quiz` | PublicQuiz | Public awareness quiz |
| `/community` | CommunityPortal | Community portal |
| `/login` | LoginPage | Login form |
| `/register` → `/register/company` | — | Alias redirect |
| `/register/company` | RegisterCompany | Company self-registration |
| `/verify-email/:token` | VerifyEmailPage | Email verification via UUID |
| `/accept-invitation/:token` | AcceptInvitation | Employee sets password |
| `/forgot-password` | ForgotPassword | Request password reset |
| `/reset-password/:token` | ResetPassword | Set new password |
| `/simulation/caught/:token` | SimulationCaught | Educational landing after clicking a phishing lure |
| `/simulation/error`, `/simulation/expired` | NotFoundPage | Simulation error states |
| `/unauthorized` | UnauthorizedPage | Access denied |
| `*` | NotFoundPage | 404 |

### Employee routes — `/employee/*` (role: `EMPLOYEE`)

| Path | Page |
|------|------|
| `/employee/dashboard` | EmployeeDashboard |
| `/employee/quizzes` | EmployeeQuizzes |
| `/employee/quizzes/:id` | TakeQuiz |
| `/employee/training` | EmployeeTraining |
| `/employee/training/:id` | TakeTraining |
| `/employee/badges` | EmployeeBadges |
| `/employee/leaderboard` | EmployeeLeaderboard |
| `/employee/profile` | EmployeeProfile |

### Company Admin routes — `/company/*` (role: `COMPANY_ADMIN`)

| Path | Page |
|------|------|
| `/company/dashboard` | CompanyDashboard |
| `/company/campaigns` | CampaignList |
| `/company/campaigns/create` | CampaignCreate |
| `/company/campaigns/:id` | CampaignDetails |
| `/company/simulations` | CompanySimulations |
| `/company/simulations/:id/analytics` | SimulationAnalytics (polls every 15s) |
| `/company/employees` | CompanyEmployees |
| `/company/training` | TrainingManagement |
| `/company/analytics` | CompanyAnalytics |
| `/company/profile` | CompanyProfile |

### Super Admin routes — `/admin/*` (role: `SUPER_ADMIN`)

| Path | Page |
|------|------|
| `/admin/dashboard` | AdminDashboard |
| `/admin/companies` | CompanyList |
| `/admin/companies/create` | CompanyCreate |
| `/admin/analytics` | PlatformAnalytics |
| `/admin/users` | UserManagement |
| `/admin/profile` | EmployeeProfile (reused) |

---

## Authentication

Managed via `AuthContext` ([src/contexts/index.jsx](src/contexts/index.jsx)).

- JWT access and refresh tokens stored in `localStorage`
- Axios request interceptor attaches the access token to every request
- Axios response interceptor catches `401`, calls the refresh endpoint, retries the original request, and logs out + redirects to `/login` if refresh fails
- `ProtectedRoute` reads the user role from context and redirects unauthorized users to `/unauthorized`
- `PublicRoute` sends already-authenticated users to their role dashboard
- `GuestRoute` renders the public layout for anyone (auth optional)

---

## API Client

All calls are defined in [src/api/endpoints.js](src/api/endpoints.js), grouped by resource. Examples:

```js
// Auth
authAPI.login(credentials)
authAPI.register(data)
authAPI.verifyEmail(token)
authAPI.resendVerification(email)
authAPI.requestPasswordReset(email)
authAPI.resetPassword(token, password)
authAPI.getProfile()
authAPI.updateProfile(data)
authAPI.changePassword(data)

// Companies
companiesAPI.getMyCompany()
companiesAPI.getStats(id)
companiesAPI.getUsers(id, params)

// Employees
employeesAPI.invite(data)
employeesAPI.getInvitationDetails(token)
employeesAPI.acceptInvitation(token, data)
employeesAPI.getPending()
employeesAPI.resend(id)
employeesAPI.cancel(id)

// Simulations
simulationsAPI.getCampaigns()
simulationsAPI.createCampaign(data)
simulationsAPI.send(id)
simulationsAPI.getSimulationFeedback(token, lang)

// Assessments / AI
assessmentsAPI.generateEmails(payload)

// Campaigns (classification quizzes)
campaignsAPI.list()
campaignsAPI.assignToEmployees(id, payload)
campaignsAPI.getStatistics(id)

// Training
trainingAPI.getMyTrainings()
trainingAPI.startTraining(id)
trainingAPI.getQuiz(id)
trainingAPI.submitQuiz(id, answers)
trainingAPI.getRiskScore()

// Gamification
gamificationAPI.getBadges()
gamificationAPI.getLeaderboard(params)
gamificationAPI.getMyPoints()

// Analytics
analyticsAPI.getOverview()
analyticsAPI.getTrends(params)
analyticsAPI.exportCSV(params)

// Notifications
notificationsAPI.getAll()
notificationsAPI.getUnreadCount()
notificationsAPI.markRead(id)
notificationsAPI.markAllRead()
notificationsAPI.clearAll()
```

---

## Internationalization

- English and Arabic, handled with `i18next` + `i18next-browser-languagedetector`
- Language auto-detected from browser; user can switch at runtime from the UI
- RTL layout applied automatically when Arabic is active (via Tailwind's `dir` utilities and `html[dir]` attribute)
- Backend content (simulation templates, training modules, quiz questions) is also bilingual — the API returns the appropriate language based on the request

---

## Notable Pages

### `/simulation/caught/:token` — SimulationCaught
Public page (no auth). Loaded when an employee clicks a phishing lure. Fetches educational feedback from `GET /simulations/feedback/<token>/` and displays the red flags the employee missed, a plain-language explanation, and next steps.

### `/accept-invitation/:token` — AcceptInvitation
Public page (no auth). Validates the invitation token, shows the inviting company's name and the pre-filled email, and lets the employee set their password. On success the account activates and verification is skipped (invite token proves ownership).

### `/company/simulations/:id/analytics` — SimulationAnalytics
Polls the backend every 15 seconds for live stats: emails sent, opened, clicked, reported. Charts click rate over time and per-employee breakdown.

### `/company/employees` — CompanyEmployees
Employee management hub. Lists active employees with risk scores; invite modal sends the invitation email; pending invitations support resend (rotates token) and cancel.

### `/company/campaigns/*` — Awareness Campaigns
Classification quiz campaigns. Admins create, assign, and view per-campaign statistics (completion rate, average score, risk distribution).

---

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:8000/api/v1` |
