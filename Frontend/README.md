# PhishAware — Frontend

React + Vite single-page application for the PhishAware cybersecurity awareness platform.

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Framework | React 19 |
| Build Tool | Vite 7 |
| Routing | React Router 6 |
| Styling | Tailwind CSS 3 |
| HTTP Client | Axios |
| Charts | Recharts |
| Icons | Lucide React |
| Internationalization | i18next + react-i18next (English + Arabic) |
| Notifications | react-hot-toast |
| Date Utilities | date-fns |

---

## Project Structure

```
Frontend/
├── src/
│   ├── api/
│   │   ├── axios.js          # Axios instance with JWT interceptors
│   │   ├── endpoints.js      # All API endpoint functions grouped by resource
│   │   ├── notifications.js  # Notification-specific API helpers
│   │   └── index.js          # Re-exports
│   ├── contexts/
│   │   └── index.jsx         # AuthContext, user state, login/logout helpers
│   ├── routes/
│   │   ├── index.jsx         # createBrowserRouter config (all routes)
│   │   └── ProtectedRoute.jsx# Route guards by role
│   ├── layouts/
│   │   ├── DashboardLayout.jsx  # Sidebar + topbar shell for authenticated pages
│   │   └── PublicLayout.jsx     # Navbar + footer shell for public pages
│   ├── pages/
│   │   ├── auth/             # Login, Register, Verify Email, Accept Invitation, Password Reset
│   │   ├── public/           # Home, Training Topics, Quiz, Community Portal, Simulation Caught
│   │   ├── employee/         # Dashboard, Training, Quizzes, Badges, Leaderboard, Profile
│   │   ├── company/          # Dashboard, Simulations, Campaigns, Employees, Training, Analytics
│   │   └── admin/            # Super Admin Dashboard, Company List, Platform Analytics
│   ├── components/           # Reusable UI components
│   ├── hooks/                # Custom React hooks
│   ├── i18n/                 # Translation files (en, ar)
│   ├── utils/                # Helper functions
│   └── main.jsx              # App entry point
├── public/                   # Static assets
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

Create a `.env` file in the `Frontend/` directory:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

### 3. Start the development server

```bash
npm run dev
```

App runs at: `http://localhost:5173`

### Other commands

```bash
npm run build     # Production build → dist/
npm run preview   # Preview production build locally
npm run lint      # Run ESLint
```

---

## Routing

The app uses React Router 6 with three role-based route groups protected by `ProtectedRoute`.

### Public Routes (no authentication required)

| Path | Page | Description |
|------|------|-------------|
| `/` | PublicHome | Landing page |
| `/training` | TrainingTopics | Public cybersecurity training topics |
| `/training/:topic` | TopicTraining | Topic detail and content |
| `/quiz` | PublicQuiz | Public quiz |
| `/community` | CommunityPortal | Community portal |
| `/login` | LoginPage | Login form |
| `/register/company` | RegisterCompany | Company self-registration |
| `/verify-email/:token` | VerifyEmailPage | Email verification via UUID token |
| `/accept-invitation/:token` | AcceptInvitation | Employee sets password via invitation token |
| `/forgot-password` | ForgotPassword | Password reset request |
| `/reset-password/:token` | ResetPassword | Set new password via token |
| `/simulation/caught/:token` | SimulationCaught | Educational page after clicking phishing link |

### Employee Routes — `/employee/*` (role: `EMPLOYEE`)

| Path | Page | Description |
|------|------|-------------|
| `/employee/dashboard` | EmployeeDashboard | Personal stats, risk score, recent activity |
| `/employee/training` | EmployeeTraining | Assigned training modules |
| `/employee/training/:id` | TakeTraining | View content + take quiz |
| `/employee/quizzes` | EmployeeQuizzes | All available quizzes |
| `/employee/quizzes/:id` | TakeQuiz | Take a specific quiz |
| `/employee/badges` | EmployeeBadges | Earned badges |
| `/employee/leaderboard` | EmployeeLeaderboard | Company leaderboard |
| `/employee/profile` | EmployeeProfile | Profile management |

### Company Admin Routes — `/company/*` (role: `COMPANY_ADMIN`)

| Path | Page | Description |
|------|------|-------------|
| `/company/dashboard` | CompanyDashboard | Company-wide stats and overview |
| `/company/simulations` | CompanySimulations | Phishing simulation campaigns (list + modal detail) |
| `/company/simulations/:id/analytics` | SimulationAnalytics | Per-simulation analytics (auto-refreshes every 15s) |
| `/company/campaigns` | CampaignList | Campaign management |
| `/company/campaigns/create` | CampaignCreate | Create new campaign |
| `/company/campaigns/:id` | CampaignDetails | Campaign detail and tracking |
| `/company/employees` | CompanyEmployees | Employee list, invite, manage |
| `/company/training` | TrainingManagement | Assign and manage training |
| `/company/analytics` | CompanyAnalytics | Full analytics dashboard |
| `/company/profile` | CompanyProfile | Company profile settings |

### Super Admin Routes — `/admin/*` (role: `SUPER_ADMIN`)

| Path | Page | Description |
|------|------|-------------|
| `/admin/dashboard` | AdminDashboard | Platform-wide overview |
| `/admin/companies` | CompanyList | All registered companies |
| `/admin/companies/create` | CompanyCreate | Manually create a company |
| `/admin/analytics` | PlatformAnalytics | Platform-wide analytics |
| `/admin/users` | UserManagement | All platform users |

---

## Authentication

Authentication is managed via `AuthContext` (`src/contexts/index.jsx`).

- JWT access and refresh tokens are stored in `localStorage`
- The Axios instance (`src/api/axios.js`) attaches the access token to every request via a request interceptor
- A response interceptor automatically attempts token refresh on `401` errors and retries the original request
- On failed refresh, the user is logged out and redirected to `/login`
- `ProtectedRoute` reads the user role from context and redirects unauthorized users to `/unauthorized`

---

## API Client

All API calls are defined in `src/api/endpoints.js`, grouped by resource:

```js
authAPI.login(credentials)
authAPI.register(data)
authAPI.verifyEmail(token)
authAPI.resendVerification(email)
authAPI.requestPasswordReset(email)
authAPI.resetPassword(token, password)
authAPI.getProfile()
authAPI.updateProfile(data)
authAPI.changePassword(data)

companiesAPI.getMyCompany()
companiesAPI.getStats(id)
companiesAPI.getUsers(id, params)

employeesAPI.invite(data)
employeesAPI.getInvitationDetails(token)
employeesAPI.acceptInvitation(token, data)
employeesAPI.getPending()

simulationsAPI.getCampaigns()
simulationsAPI.createCampaign(data)
simulationsAPI.send(id)
simulationsAPI.getSimulationFeedback(token, lang)

trainingAPI.getMyTrainings()
trainingAPI.startTraining(id)
trainingAPI.getQuiz(id)
trainingAPI.submitQuiz(id, answers)
trainingAPI.getRiskScore()

analyticsAPI.getOverview()
analyticsAPI.getTrends(params)
analyticsAPI.exportCSV(params)

notificationsAPI.getAll()
notificationsAPI.getUnreadCount()
notificationsAPI.markRead(id)
notificationsAPI.markAllRead()
notificationsAPI.clearAll()
```

---

## Internationalization (i18n)

The app supports **English** and **Arabic** via i18next. Language is detected from browser settings and can be toggled at runtime.

- Translation files: `src/i18n/`
- RTL layout is applied automatically when Arabic is active
- Backend data (training content, simulation templates) is also bilingual — the API returns the appropriate language based on the request

---

## Key Pages

### SimulationCaught (`/simulation/caught/:token`)
Public page — no authentication required. Loaded when an employee clicks a phishing link. Fetches educational feedback from the API (`GET /simulations/feedback/<token>/`) and displays the red flags that should have been spotted, along with an explanation.

### AcceptInvitation (`/accept-invitation/:token`)
Public page — no authentication required. Validates the invitation token, shows the company name and pre-filled email, and lets the employee set their password to activate their account.

### SimulationAnalytics (`/company/simulations/:id/analytics`)
Polls the backend every 15 seconds to display live campaign stats: emails sent, opened, clicked, and reported. Includes charts for click rate over time and per-employee breakdown.

### CompanyEmployees (`/company/employees`)
Employee management hub. Displays all active employees with their risk scores. Includes an invite modal (sends invitation email), resend, and cancel actions for pending invitations.

---

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:8000/api/v1` |
