# Security Audit Prompt — PhishAware Platform

> Paste this entire document into a fresh Claude Opus chat opened at the project root (`c:\Users\alhar\OneDrive\Desktop\SeniorProject`). The auditing Claude will have file-system access to the repo and should perform the audit by reading the actual code.

---

## Your Role

You are a senior application security engineer performing a full security audit of the **PhishAware** platform — a phishing-awareness training and simulation product built as a senior project. Your audit must be grounded in the **OWASP Top 10 (2021 edition, the current release)** and incorporate guidance from the OWASP **API Security Top 10 (2023)** and the OWASP **ASVS v4.0.3 / v5.0** where relevant. Reference any newer OWASP advisories or CVEs published through 2025–2026 that apply to the libraries in use.

You must produce a serious, evidence-based report — not generic OWASP commentary. Every finding must cite specific files, line numbers, and code excerpts from this repository.

---

## Platform Overview

**PhishAware** is a bilingual (English / Arabic) phishing-simulation and security-training SaaS for organizations. Companies invite their employees, run simulated phishing campaigns, track who clicks, and assign training modules to those who fall for them.

### Stack

- **Backend**: Django + Django REST Framework, SimpleJWT for auth, SQLite/PostgreSQL, SendGrid SMTP for email.
- **Frontend**: React 18 + Vite, React Router, Tailwind, axios.
- **Email**: SendGrid relay (`smtp.sendgrid.net:587`).
- **Deployment target**: standard Django + static React build.

### Repository Layout

```
Backend/
  apps/
    accounts/        # User model, auth, email verification, employee invitations
    companies/       # Company / org model
    simulations/     # SimulationTemplate, SimulationCampaign, EmailSimulation, TrackingEvent
    training/        # Training modules, quiz questions, risk score signals
    campaigns/       # Campaign orchestration
    core/            # Shared utilities, email helpers, email templates
  config/            # Django settings, urls, wsgi/asgi
  manage.py
Frontend/
  src/
    pages/           # Route pages (LoginPage, RegisterPage, CompanyEmployees, etc.)
    components/      # Shared components
    api/             # axios endpoints.js
    routes/          # index.jsx — route table
    i18n/            # ar.json, en.json
```

### Critical Flows to Audit

1. **Authentication**
   - Custom JWT obtain serializer (`CustomTokenObtainPairSerializer`) with email-verification gate.
   - `is_staff=True` bypasses email verification — verify this is intentional and not exploitable.
   - Password reset flow (`send_password_reset_email`).

2. **Email verification**
   - `User.verification_token` (UUID), `verification_token_created`.
   - Endpoints: `POST /api/v1/auth/verify-email/<uuid>/`, `POST /api/v1/auth/resend-verification/`.
   - Frontend route: `/verify-email/:token`.
   - Check token entropy, expiry, replay, single-use semantics, rate limiting.

3. **Employee invitation**
   - `User.invitation_token` (UUID), `invitation_status` (PENDING/ACCEPTED/EXPIRED).
   - 7-day expiry (`INVITATION_EXPIRY_DAYS`).
   - Public endpoints: `POST /employees/invite/`, `GET /employees/invite/<uuid>/`, `POST /employees/invite/<uuid>/accept/`.
   - Invited users created with `is_active=False`; activated on accept.
   - Verify: who can invite, can attacker enumerate tokens, can accept be replayed, are emails normalized.

4. **Simulation tracking (public, unauthenticated by design)**
   - Tracking pixel and lure-link endpoints redirect to `/simulation/caught/:token`.
   - Public feedback endpoint: `GET /api/v1/simulations/feedback/{link_token}/`.
   - `TrackingEvent.save()` mutates denormalized stats AND fires `post_save` signal that updates risk scores.
   - Verify: link token entropy, IDOR on feedback endpoint, abuse / inflation of stats by repeated requests, SSRF risk via redirects, open-redirect risk.

5. **Multi-tenancy / authorization**
   - Every model with a `company` FK must filter by the requesting user's company.
   - Audit all `ViewSet.get_queryset()` and any custom `@action` methods for missing tenant scoping (BOLA / IDOR).

6. **Email sending**
   - `Backend/apps/core/emails.py` — verification, invitation, password reset, simulation emails.
   - HTML templates in `Backend/apps/core/templates/emails/`.
   - Check for header injection, template-injection, and unvalidated `FRONTEND_URL` use in links.

7. **File handling / CSV**
   - `generate_package` produces CSV exports. Check CSV-injection (formula injection: `=`, `+`, `-`, `@` prefixes).
   - Any uploads (logos, avatars, attachments) — type/size validation, path traversal.

8. **Frontend**
   - `axios` interceptors and token storage (localStorage vs httpOnly cookie).
   - `dangerouslySetInnerHTML` usage.
   - Routing guards on protected pages.
   - i18n strings rendered into HTML.

---

## OWASP Top 10 (2021) — Required Coverage

For **each** category, do the following:

1. State the category and the concrete attack scenarios you searched for.
2. Show the files / endpoints you examined.
3. Report findings with **severity** (Critical / High / Medium / Low / Informational), a **proof-of-concept request or code excerpt**, and a **specific remediation** (file + line + suggested code).
4. If a category has no findings, say so explicitly and describe what you verified.

Categories:

- **A01 — Broken Access Control** (focus: tenant isolation, IDOR on `/employees/invite/<uuid>/`, simulation campaign access, training assignments).
- **A02 — Cryptographic Failures** (focus: token generation source — `uuid4` vs `secrets`, JWT secret handling, password hashing config, TLS expectations, SendGrid credential storage).
- **A03 — Injection** (focus: any raw SQL / `extra()` / `RawSQL`, ORM `__icontains` over user input, template injection in email HTML, CSV injection in exports, log injection).
- **A04 — Insecure Design** (focus: invitation acceptance design, public tracking endpoints, rate limiting absence, account enumeration via login/register/resend).
- **A05 — Security Misconfiguration** (focus: `DEBUG`, `ALLOWED_HOSTS`, `SECRET_KEY` in repo, CORS, CSRF, security headers, default Django admin exposure, error verbosity).
- **A06 — Vulnerable & Outdated Components** (read `Backend/requirements*.txt` and `Frontend/package.json` + lockfiles; flag any package with known CVEs through 2026; recommend pinned upgrades).
- **A07 — Identification & Authentication Failures** (focus: JWT lifetimes / refresh / blacklist, password policy, MFA absence, credential stuffing protection, session fixation, `is_staff` verification bypass).
- **A08 — Software & Data Integrity Failures** (focus: deserialization, unsigned tokens, CI/build-time integrity, package source trust).
- **A09 — Security Logging & Monitoring Failures** (focus: what auth/admin events are logged, are tokens redacted, is PII in logs).
- **A10 — Server-Side Request Forgery** (focus: any URL-fetching code, redirect endpoints, unvalidated `next=` params, image/avatar fetching).

Also explicitly cover from **OWASP API Security Top 10 (2023)**:

- **API1 BOLA**, **API2 Broken Authentication**, **API3 Broken Object Property Level Authorization** (mass-assignment via DRF serializers — check every `fields = '__all__'`), **API4 Unrestricted Resource Consumption** (no rate limits on `/resend-verification/`, `/employees/invite/`, public feedback endpoint), **API8 Security Misconfiguration**, **API9 Improper Inventory Management** (Swagger/OpenAPI exposure in prod).

---

## Method (do this in order)

1. **Map the attack surface.** List every URL pattern (Django `urls.py` files + DRF routers) with: path, view, auth required, permission classes, and rate limit. Produce this as a table.
2. **Audit settings.** Read `Backend/config/settings.py` (and any `settings_*.py`). Report on every security-relevant setting.
3. **Audit models** for sensitive fields stored in plaintext, missing `unique=True` where needed, and missing indexes that enable timing attacks.
4. **Audit serializers** for `fields = '__all__'`, missing `read_only_fields`, and writable fields that should not be writable (e.g., `role`, `company`, `is_staff`, `is_verified`, `invitation_status`).
5. **Audit viewsets and views** for missing `permission_classes`, missing tenant filtering in `get_queryset`, and unsafe `@action` methods.
6. **Audit the public endpoints** (anything with `permission_classes = [AllowAny]` or unauthenticated by design): verification, resend, invitation accept, tracking pixel, lure-link redirect, feedback. Each must be analyzed for enumeration, replay, and abuse.
7. **Audit email-sending code** (`apps/core/emails.py` + templates) for header injection and unsafe URL construction.
8. **Audit the frontend** for token storage, XSS sinks, missing route guards, and CORS assumptions.
9. **Dependency review** with current CVE knowledge.
10. **Write the report.**

---

## Deliverable Format

Produce a single Markdown report saved as `SECURITY_AUDIT_REPORT.md` at the repo root with this structure:

```
# PhishAware Security Audit — <date>

## 1. Executive Summary
- Overall risk rating
- Top 5 issues to fix immediately
- Top 5 systemic weaknesses

## 2. Scope & Method
- Commit SHA audited
- Files examined
- What was NOT covered (and why)

## 3. Attack Surface Map
- URL table (path | view | auth | perms | rate-limited)

## 4. Findings
For each finding:
### F-001 — <Title>  [Severity: High]
- **Category**: A01 Broken Access Control
- **Location**: Backend/apps/simulations/views.py:142
- **Description**: ...
- **Evidence** (code excerpt):
  ```python
  ...
  ```
- **Proof of concept** (curl / request):
  ```
  ...
  ```
- **Impact**: ...
- **Remediation** (concrete diff):
  ```diff
  - ...
  + ...
  ```

## 5. OWASP Top 10 (2021) Coverage Matrix
Table: category | findings count | status

## 6. OWASP API Top 10 (2023) Coverage Matrix
Same shape.

## 7. Dependency CVE Report
Table: package | installed | latest | known CVEs | recommended action.

## 8. Hardening Recommendations (no specific finding)
- Headers, rate limits, logging, monitoring, CI checks, secret management.

## 9. Appendix
- Tools / commands run
- Files read
```

---

## Rules

- **Read the actual code.** Do not guess. Every finding must cite a real file and line number from this repo.
- **No false positives padding.** If you cannot reproduce or strongly justify it, leave it out or mark Informational.
- **Prefer concrete remediations** (a diff, a code snippet, a setting value) over generic advice.
- **Severity must reflect exploitability**, not just theoretical risk. A self-XSS in an admin-only page is not Critical.
- **Be skeptical of comments and docstrings** — verify behavior in code.
- **Do not modify any source files** during the audit. Read-only. The report itself is the only file you write.
- When uncertain about an environment-dependent setting (e.g., `DEBUG`, `ALLOWED_HOSTS` in prod), state the assumption explicitly and audit both the in-repo value and the production-intended value.

Begin by mapping the attack surface (step 1 of Method). Work through every step. Do not skip the dependency CVE review.
