"""
PhishAware – Complete System Documentation Generator
IEEE-style thesis document merging Backend + Frontend chapters
Run: python generate_complete_doc.py
"""
import os, copy
from docx import Document
from docx.shared import Inches, Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

# ── Paths ─────────────────────────────────────────────────────────────────────
HERE        = os.path.dirname(os.path.abspath(__file__))
BACKEND_DOC = os.path.join(HERE, 'backend_documentation.docx')
SHOTS_DIR   = os.path.join(HERE, 'screenshots')
OUTPUT_DOC  = os.path.join(HERE, 'PhishAware_Complete_Documentation.docx')

# ── Create fresh IEEE doc ─────────────────────────────────────────────────────
doc = Document()

# IEEE page setup: A4, 1-inch margins
sec = doc.sections[0]
sec.page_width    = Inches(8.27)
sec.page_height   = Inches(11.69)
sec.top_margin    = Inches(1)
sec.bottom_margin = Inches(1)
sec.left_margin   = Inches(1)
sec.right_margin  = Inches(1)

# ── Define IEEE styles ────────────────────────────────────────────────────────
normal = doc.styles['Normal']
normal.font.name = 'Times New Roman'
normal.font.size = Pt(12)
normal.paragraph_format.space_after  = Pt(6)
normal.paragraph_format.line_spacing = Pt(18)

h1 = doc.styles['Heading 1']
h1.font.name = 'Times New Roman'; h1.font.size = Pt(14); h1.font.bold = True
h1.font.color.rgb = RGBColor(0,0,0)
h1.paragraph_format.space_before = Pt(18); h1.paragraph_format.space_after = Pt(6)

h2 = doc.styles['Heading 2']
h2.font.name = 'Times New Roman'; h2.font.size = Pt(12); h2.font.bold = True
h2.font.color.rgb = RGBColor(0,0,0)
h2.paragraph_format.space_before = Pt(12); h2.paragraph_format.space_after = Pt(4)

h3 = doc.styles['Heading 3']
h3.font.name = 'Times New Roman'; h3.font.size = Pt(12)
h3.font.bold = True; h3.font.italic = True
h3.font.color.rgb = RGBColor(0,0,0)
h3.paragraph_format.space_before = Pt(8); h3.paragraph_format.space_after = Pt(4)

try:
    cap_style = doc.styles['Caption']
except:
    cap_style = doc.styles.add_style('Caption', 1)
cap_style.font.name = 'Times New Roman'; cap_style.font.size = Pt(10)
cap_style.font.italic = True
cap_style.font.color.rgb = RGBColor(0x37,0x41,0x51)
cap_style.paragraph_format.space_before = Pt(4)
cap_style.paragraph_format.space_after  = Pt(10)

# ── Colours ───────────────────────────────────────────────────────────────────
DARK_BLUE = RGBColor(0x1E, 0x3A, 0x8A)
MID_BLUE  = RGBColor(0x3B, 0x82, 0xF6)
GRAY      = RGBColor(0x37, 0x41, 0x51)
WHITE     = RGBColor(0xFF, 0xFF, 0xFF)
BLACK     = RGBColor(0x00, 0x00, 0x00)

# ── Helpers ───────────────────────────────────────────────────────────────────
def shade_cell(cell, hex_color):
    tc   = cell._tc
    tcPr = tc.get_or_add_tcPr()
    shd  = OxmlElement('w:shd')
    shd.set(qn('w:val'),   'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'),  hex_color)
    tcPr.append(shd)

def add_h1(text):
    p = doc.add_heading(text, level=1)
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    for r in p.runs:
        r.font.name = 'Times New Roman'; r.font.size = Pt(14)
        r.font.bold = True; r.font.color.rgb = BLACK
    return p

def add_h2(text):
    p = doc.add_heading(text, level=2)
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    for r in p.runs:
        r.font.name = 'Times New Roman'; r.font.size = Pt(12)
        r.font.bold = True; r.font.color.rgb = BLACK
    return p

def add_h3(text):
    p = doc.add_heading(text, level=3)
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    for r in p.runs:
        r.font.name = 'Times New Roman'; r.font.size = Pt(12)
        r.font.bold = True; r.font.italic = True; r.font.color.rgb = BLACK
    return p

def add_body(text):
    p = doc.add_paragraph(style='Normal')
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    r = p.add_run(text)
    r.font.name = 'Times New Roman'; r.font.size = Pt(12)
    return p

def add_bullet(text):
    p = doc.add_paragraph(style='Normal')
    p.paragraph_format.left_indent = Inches(0.3)
    r0 = p.add_run('• '); r0.font.name = 'Times New Roman'; r0.font.size = Pt(12)
    r1 = p.add_run(text); r1.font.name = 'Times New Roman'; r1.font.size = Pt(12)
    return p

def add_table(headers, rows, caption_text='', caption=''):
    # support both parameter names
    if caption and not caption_text:
        caption_text = caption
    # IEEE: caption ABOVE table
    if caption_text:
        cp = doc.add_paragraph()
        cp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = cp.add_run(caption_text)
        r.font.name = 'Times New Roman'; r.font.size = Pt(10); r.font.bold = True

    t = doc.add_table(rows=1 + len(rows), cols=len(headers))
    t.style = 'Table Grid'; t.alignment = WD_TABLE_ALIGNMENT.CENTER

    for i, h in enumerate(headers):
        cell = t.rows[0].cells[i]
        shade_cell(cell, '1E3A8A')
        cell.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = cell.paragraphs[0].add_run(h)
        r.font.name = 'Times New Roman'; r.font.bold = True
        r.font.size = Pt(9); r.font.color.rgb = WHITE

    for ri, row in enumerate(rows):
        bg = 'F3F4F6' if ri % 2 == 0 else 'FFFFFF'
        for ci, val in enumerate(row):
            cell = t.rows[ri+1].cells[ci]
            shade_cell(cell, bg)
            r = cell.paragraphs[0].add_run(str(val))
            r.font.name = 'Times New Roman'; r.font.size = Pt(9)

    doc.add_paragraph()
    return t

def add_figure(fig_id, caption_text, width=Inches(5.8)):
    # Search for file
    found = None
    for ext in ['.png','.jpg','.jpeg','.PNG','.JPG']:
        path = os.path.join(SHOTS_DIR, fig_id + ext)
        if os.path.exists(path):
            found = path; break

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    if found:
        p.add_run().add_picture(found, width=width)
    else:
        r = p.add_run(f'[ {fig_id} - image not found ]')
        r.font.color.rgb = MID_BLUE; r.font.size = Pt(11)

    # IEEE: caption below figure
    try:
        cap = doc.add_paragraph(style='Caption')
    except:
        cap = doc.add_paragraph()
    cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = cap.add_run(f'{fig_id}: {caption_text}')
    r.font.name = 'Times New Roman'; r.font.size = Pt(10)
    r.font.italic = True; r.font.color.rgb = GRAY
    doc.add_paragraph()

def insert_toc_field():
    add_h1('Table of Contents')
    p = doc.add_paragraph()
    b = OxmlElement('w:fldChar'); b.set(qn('w:fldCharType'),'begin')
    i = OxmlElement('w:instrText'); i.set(qn('xml:space'),'preserve')
    i.text = ' TOC \\o "1-3" \\h \\z \\u '
    s = OxmlElement('w:fldChar'); s.set(qn('w:fldCharType'),'separate')
    e = OxmlElement('w:fldChar'); e.set(qn('w:fldCharType'),'end')
    ph = OxmlElement('w:r')
    t = OxmlElement('w:t'); t.set(qn('xml:space'),'preserve')
    t.text = '[Right-click -> Update Field to populate Table of Contents]'; ph.append(t)
    for x in [OxmlElement('w:r'), OxmlElement('w:r'), OxmlElement('w:r'), ph, OxmlElement('w:r')]:
        p._p.append(x)
    p._p[0].append(b); p._p[1].append(i); p._p[2].append(s); p._p[4].append(e)

def insert_tof_field():
    add_h1('List of Figures')
    p = doc.add_paragraph()
    b = OxmlElement('w:fldChar'); b.set(qn('w:fldCharType'),'begin')
    i = OxmlElement('w:instrText'); i.set(qn('xml:space'),'preserve')
    i.text = ' TOC \\h \\z \\t "Caption,1" '
    s = OxmlElement('w:fldChar'); s.set(qn('w:fldCharType'),'separate')
    e = OxmlElement('w:fldChar'); e.set(qn('w:fldCharType'),'end')
    ph = OxmlElement('w:r')
    t = OxmlElement('w:t'); t.set(qn('xml:space'),'preserve')
    t.text = '[Right-click -> Update Field to populate List of Figures]'; ph.append(t)
    for x in [OxmlElement('w:r'), OxmlElement('w:r'), OxmlElement('w:r'), ph, OxmlElement('w:r')]:
        p._p.append(x)
    p._p[0].append(b); p._p[1].append(i); p._p[2].append(s); p._p[4].append(e)

def insert_tot_field():
    add_h1('List of Tables')
    p = doc.add_paragraph()
    b = OxmlElement('w:fldChar'); b.set(qn('w:fldCharType'),'begin')
    i = OxmlElement('w:instrText'); i.set(qn('xml:space'),'preserve')
    i.text = ' TOC \\h \\z \\t "Table Caption,1" '
    s = OxmlElement('w:fldChar'); s.set(qn('w:fldCharType'),'separate')
    e = OxmlElement('w:fldChar'); e.set(qn('w:fldCharType'),'end')
    ph = OxmlElement('w:r')
    t = OxmlElement('w:t'); t.set(qn('xml:space'),'preserve')
    t.text = '[Right-click -> Update Field to populate List of Tables]'; ph.append(t)
    for x in [OxmlElement('w:r'), OxmlElement('w:r'), OxmlElement('w:r'), ph, OxmlElement('w:r')]:
        p._p.append(x)
    p._p[0].append(b); p._p[1].append(i); p._p[2].append(s); p._p[4].append(e)

def copy_backend():
    src = Document(BACKEND_DOC)
    for elem in src.element.body:
        tag = elem.tag.split('}')[-1] if '}' in elem.tag else elem.tag
        if tag == 'sectPr':
            continue
        doc.element.body.append(copy.deepcopy(elem))

# =============================================================================
#  TITLE PAGE
# =============================================================================
p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = p.add_run('PhishAware')
r.font.name='Times New Roman'; r.font.size=Pt(28); r.font.bold=True

doc.add_paragraph()
p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = p.add_run('A Cybersecurity Awareness Platform for Saudi Arabia')
r.font.name='Times New Roman'; r.font.size=Pt(16)

doc.add_paragraph()
p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = p.add_run('"Click Smarter, Stay Safer"')
r.font.name='Times New Roman'; r.font.size=Pt(14); r.font.italic=True

doc.add_paragraph(); doc.add_paragraph()
p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = p.add_run('Supervisor: Dr. Saim Rasheed')
r.font.name='Times New Roman'; r.font.size=Pt(12)

p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = p.add_run('March 2026')
r.font.name='Times New Roman'; r.font.size=Pt(12)

doc.add_page_break()

# =============================================================================
#  TOC / TOF / TOT
# =============================================================================
insert_toc_field()
doc.add_page_break()
insert_tof_field()
doc.add_page_break()
insert_tot_field()
doc.add_page_break()

# =============================================================================
#  BACKEND (copied from existing doc)
# =============================================================================
copy_backend()
doc.add_page_break()

# =============================================================================
#  CHAPTER 6 – DESIGN OVERVIEW
# =============================================================================
add_h1('6. Design Overview')
add_body(
    'Before the frontend implementation began, a design system was established to ensure '
    'visual consistency across all three portals: Public, Employee, and Company Admin. '
    'This chapter documents the core design decisions including the color palette, '
    'typography, and branding that were applied throughout the PhishAware platform. '
    'All design choices were made with bilingual Arabic/English support and cultural '
    'relevance for Saudi Arabian users in mind.'
)

add_h2('6.1 Color Palette')
add_body(
    'The color system is built on a primary blue brand color with semantic colors '
    'for status communication. Colors were selected to meet WCAG 2.1 AA contrast '
    'requirements ensuring accessibility for all users. The palette is defined in '
    'the Tailwind CSS configuration file and applied consistently across all components.'
)
add_table(
    headers=['Color Name', 'Hex Code', 'Usage'],
    rows=[
        ['Primary Blue (Main)', '#3B82F6', 'Buttons, links, active states, highlights'],
        ['Primary Dark',        '#1E3A8A', 'Headers, sidebar, navigation background'],
        ['Primary Light',       '#BFDBFE', 'Hover states, input focus, card backgrounds'],
        ['Success Green',       '#22C55E', 'Completed trainings, passed quizzes, success badges'],
        ['Warning Amber',       '#F59E0B', 'Pending assignments, in-progress states, warnings'],
        ['Danger Red',          '#EF4444', 'Errors, failed attempts, delete action buttons'],
        ['Secondary Gray',      '#64748B', 'Secondary text, labels, metadata'],
        ['Light Gray',          '#E2E8F0', 'Borders, dividers, subtle backgrounds'],
        ['Dark',                '#0F172A', 'Dark mode background, high-contrast text'],
        ['White',               '#FFFFFF', 'Card surfaces, content backgrounds'],
    ],
    caption='TABLE 6.1: PhishAware Color Palette',
)
add_figure('Figure_7.1', 'PhishAware platform color palette showing all primary, semantic, and neutral colors with hex codes and usage descriptions.')

add_h2('6.2 Typography')
add_body(
    'Two font families support the bilingual interface. Inter is used for all English '
    'content, chosen for its excellent screen readability. Cairo is used for all Arabic '
    'content as it provides clean rendering for Arabic script with proportions that '
    'harmonize visually with Inter when both languages appear on the same page.'
)
add_table(
    headers=['Language', 'Font Family', 'Fallback', 'Usage'],
    rows=[
        ['English', 'Inter',  'system-ui, sans-serif',        'All English text, labels, headings'],
        ['Arabic',  'Cairo',  'Noto Sans Arabic, sans-serif', 'All Arabic text, RTL layouts'],
    ],
    caption='TABLE 6.2: Typography Font Families',
)

add_h2('6.3 Logo and Branding')
add_body(
    'The PhishAware logo combines a shield icon representing cybersecurity protection '
    'with the platform wordmark. It is displayed in the top-left corner of all '
    'authenticated portals and in the public portal navigation bar.'
)
add_figure('Figure_7.3', 'PhishAware logo as displayed in the application navigation bar, featuring the shield security icon combined with the platform wordmark.')

# =============================================================================
#  CHAPTER 7 – WEEK 9
# =============================================================================
doc.add_page_break()
add_h1('7. Frontend Development – Week 9: Foundation and Authentication')
add_body(
    'Week 9 established the React.js frontend infrastructure and implemented the complete '
    'authentication system. This included project scaffolding with Vite, bilingual support '
    'via i18next, a centralized Axios API service layer, and all authentication-related '
    'user interfaces. By the end of this week, users could register a company account, '
    'log in securely, verify their email address, and be routed to the correct portal '
    'based on their assigned role.'
)
add_table(
    headers=['Task', 'Type', 'Description'],
    rows=[
        ['Setup React.js environment',      'Frontend', 'Initialized with Vite, configured React Router v6 and folder structure'],
        ['Configure i18next for bilingual',  'Frontend', 'Arabic/English with automatic RTL layout, persisted in localStorage'],
        ['Create Axios API service layer',   'Frontend', 'Centralized HTTP client with JWT request/response interceptors'],
        ['Build authentication pages',       'Frontend', 'Login, registration, and email verification user interfaces'],
        ['Create protected route system',    'Frontend', 'Role-based access control for Employee and Admin portals'],
    ],
    caption='TABLE 7.1: Week 9 Development Tasks',
)

add_h2('7.1 React.js Environment Setup')
add_body(
    'The project was bootstrapped using Vite, which provides faster build times and '
    'hot module replacement compared to Create React App. React Router v6 handles '
    'client-side routing with a nested route structure separating the Public, Employee, '
    'and Admin portal paths. Source code is organized by feature modules under src/ '
    'with dedicated folders for pages, components, api services, routing, and '
    'internationalization resources.'
)
add_figure('Figure_8.1', 'Frontend source code folder structure in VS Code showing the feature-module organization with separate directories for pages, components, api services, routes, and i18n translation files.')

add_h2('7.2 Bilingual Configuration (i18next)')
add_body(
    'The i18next library was configured to support Arabic and English. All interface '
    'text is externalized into JSON translation files (en.json and ar.json) so no '
    'hardcoded strings exist in component code. Switching to Arabic sets the HTML '
    'dir="rtl" attribute and the entire layout mirrors automatically — text aligns '
    'right, navigation flows right-to-left, and form fields reverse. The language '
    'preference is stored in localStorage and persists across sessions.'
)
add_figure('Figure_8.2', 'Language switcher (AR/EN) toggle button in the navigation bar allowing users to switch between Arabic and English instantly without a page reload.')
add_figure('Figure_8.3a', 'Application interface in English showing the standard left-to-right (LTR) layout with left-aligned text, left-positioned navigation, and standard form field order.')
add_figure('Figure_8.3b', 'Application interface in Arabic showing the complete right-to-left (RTL) mirrored layout with right-aligned text, right-positioned navigation, and reversed element order.')
add_table(
    headers=['Feature', 'Implementation', 'Behavior'],
    rows=[
        ['Language Toggle',   'Button in navbar',           'Switches language instantly without page reload'],
        ['RTL Layout',        'dir="rtl" on html element',  'Full page layout mirrors automatically for Arabic'],
        ['Translation Files', 'en.json and ar.json',        'All UI strings stored as key-value pairs by feature'],
        ['Persistence',       'localStorage',               'Language choice survives browser refresh and re-login'],
        ['Font Switching',    'CSS font-family per lang',   'Inter for English, Cairo for Arabic automatically'],
    ],
    caption='TABLE 7.2: Bilingual Configuration Features',
)

add_h2('7.3 Axios API Service Layer')
add_body(
    'A centralized Axios instance serves as the single HTTP client for all backend '
    'communication. A request interceptor automatically attaches the JWT access token '
    'to every outgoing request\'s Authorization header. A response interceptor catches '
    'HTTP 401 errors, silently exchanges the refresh token for a new access token, '
    'and retries the original request. If the refresh also fails the user is redirected '
    'to login. Endpoints are organized into domain-specific service files.'
)
add_table(
    headers=['Service File', 'Domain', 'Key Endpoints'],
    rows=[
        ['auth.js',        'Authentication', 'login, register, verify-email, refresh, resend-verification'],
        ['campaigns.js',   'Campaigns',      'create, list, update, get-status'],
        ['simulations.js', 'Simulations',    'list-templates, create, assign-employees, send, feedback'],
        ['training.js',    'Training',       'list-modules, details, assign, submit-quiz, get-progress'],
        ['employees.js',   'Employees',      'list, invite, get-details, get-risk-score'],
        ['gamification.js','Gamification',   'leaderboard, badges, points, my-badges'],
        ['analytics.js',   'Analytics',      'overview, risk-score-trend, training-completion-rates'],
    ],
    caption='TABLE 7.3: API Service Layer Files',
)

add_h2('7.4 Login Page')
add_body(
    'The login page presents a centered card layout with the PhishAware logo, email '
    'and password fields, a Sign In button, and links for password recovery and new '
    'company registration. Client-side validation checks email format and minimum '
    'password length before submitting. On success, tokens are stored and the user '
    'is redirected to their role-appropriate portal. The page is fully bilingual '
    'with complete RTL transformation in Arabic.'
)
add_figure('Figure_8.4', 'Login page in English showing the PhishAware logo, email and password input fields with validation, the Sign In button, and links for password recovery and company registration.')
add_figure('Figure_8.5', 'Login page in Arabic demonstrating complete right-to-left layout transformation with mirrored form structure, right-aligned labels, and Arabic button and link text.')
add_figure('Figure_8.6', 'Login page displaying inline validation error messages with red-bordered fields, guiding the user to correct invalid email format or missing password input.')
add_table(
    headers=['Field', 'Validation Rule', 'Error Message Shown'],
    rows=[
        ['Email',    'Required, valid email format',     'Please enter a valid email address'],
        ['Password', 'Required, minimum 8 characters',  'Password must be at least 8 characters'],
        ['Form',     'Credentials verified by backend',  'Invalid email or password'],
    ],
    caption='TABLE 7.4: Login Form Validation Rules',
)

add_h2('7.5 Company Registration Page')
add_body(
    'New organizations register through a single form collecting company identification '
    'and the first administrator account. The form captures company name and website URL '
    'for company identification, and the administrator\'s first name, last name, email, '
    'and password. A password validation indicator enforces the 8-character minimum '
    'requirement inline. After successful submission, a verification email is sent '
    'and the account remains inactive until the link is clicked.'
)
add_figure('Figure_8.7', 'Company registration form showing the Company Name and Website URL fields for company identification, and the administrator account fields (first name, last name, email, password) below.')
add_figure('Figure_8.8', 'Password minimum length validation message displayed inline below the password field when the entered password is fewer than 8 characters, prompting the user to lengthen their input.')

add_h2('7.6 Email Verification')
add_body(
    'After registration the backend sends a verification email containing a unique '
    'UUID token link. Clicking the link opens the verification page which calls the '
    'backend API. On success the user sees a confirmation page with a checkmark icon '
    'and a Login button. Pre-existing accounts and staff accounts bypass verification '
    'automatically.'
)
add_figure('Figure_8.9', 'Email verification success page shown after the user clicks the verification link from their registration email, confirming the account is now active and ready to use.')

# =============================================================================
#  CHAPTER 8 – WEEK 10
# =============================================================================
doc.add_page_break()
add_h1('8. Frontend Development – Week 10: Admin Portal and Campaign Management')
add_body(
    'Week 10 built the complete Company Administrator portal. This is the primary '
    'interface through which organizations manage phishing simulation campaigns, '
    'monitor employee risk, administer training assignments, and view analytics. '
    'The portal uses a persistent sidebar layout providing access to all management '
    'functions from a unified interface.'
)
add_table(
    headers=['Task', 'Type', 'Description'],
    rows=[
        ['Build admin main layout',          'Frontend', 'Persistent fixed sidebar navigation and top header bar'],
        ['Create campaign management UI',    'Frontend', 'Interface for creating and tracking phishing campaigns'],
        ['Build template library UI',        'Frontend', 'Four-step guided simulation creation with pre-built templates'],
        ['Create admin analytics dashboard', 'Frontend', 'Risk score trends, training completion rates, and KPI cards'],
        ['Build employee management UI',     'Frontend', 'Employee list, invitation system, and detail profile views'],
        ['Implement AI email generation UI', 'Frontend', 'AI-powered phishing template generation and preview interface'],
    ],
    caption='TABLE 8.1: Week 10 Development Tasks',
)

add_h2('8.1 Admin Portal Layout')
add_body(
    'The admin portal uses a persistent fixed sidebar on the left containing all '
    'navigation links: Dashboard, Campaigns, Simulations, Analytics and Reports, '
    'Employees, Training, and Profile. The active page is highlighted in blue. '
    'The top header displays a notification bell with unread badge count, an AR/EN '
    'language toggle, and a user profile dropdown showing the admin\'s name. '
    'The main content area is scrollable while the sidebar and header remain fixed. '
    'No search bar is present in the header — navigation is entirely through the sidebar.'
)
add_figure('Figure_9.1', 'Admin portal full layout showing the fixed sidebar navigation on the left with all menu items, the top header bar, and the main dashboard content area with summary widgets and data cards.')
add_figure('Figure_9.2', 'Admin sidebar fully expanded showing all navigation menu items with icons and text labels. The currently active page item is highlighted with a blue background.')
add_figure('Figure_9.3', 'Admin header bar showing the notification bell icon with unread count badge, the AR/EN language toggle button, and the user profile dropdown displaying the administrator\'s name and role.')

add_h2('8.2 Campaign Management')
add_body(
    'The campaigns section allows administrators to create and manage phishing awareness '
    'campaigns. The campaign creation form provides configuration for the language '
    'distribution of emails (AR/EN ratio) enabling campaigns with a mix of Arabic '
    'and English emails, and a phishing ratio setting to control simulation intensity. '
    'Once created, campaigns appear in a list view with their current status badge.'
)
add_figure('Figure_9.4', 'Campaigns page showing an existing campaign displayed in Draft status with the campaign name, creation date, status badge, and available management action buttons.')
add_figure('Figure_9.5', 'Campaign creation page showing the AR/EN language ratio configuration allowing administrators to set the proportion of Arabic versus English simulation emails, and the phishing ratio control for simulation intensity.')
add_figure('Figure_9.6', 'Employee assignment page for the campaign showing the list of company employees with checkboxes for selection, department filter dropdown, and selected employee count display.')
add_table(
    headers=['Campaign Status', 'Badge Color', 'Description'],
    rows=[
        ['Draft',     'Gray',   'Campaign created but emails not yet sent'],
        ['Active',    'Yellow', 'Campaign is currently running'],
        ['Completed', 'Green',  'All simulation emails processed and campaign ended'],
        ['Paused',    'Orange', 'Campaign temporarily stopped by administrator'],
    ],
    caption='TABLE 8.2: Campaign Status Definitions',
)

add_h2('8.3 Simulation Template Management')
add_body(
    'The simulations section manages phishing email templates and guides administrators '
    'through a four-step simulation creation process. Pre-built templates cover '
    'Saudi-specific phishing scenarios including fake Absher notifications, SAMA '
    'banking alerts, Nafath verification requests, and delivery service messages. '
    'The step-by-step wizard ensures all required configuration is completed before '
    'emails are dispatched.'
)
add_figure('Figure_9.7', 'Simulations tab showing the complete list of available phishing simulation templates with names, category tags, and action buttons for managing or launching each template.')
add_figure('Figure_9.8', 'Simulation creation Step 1: the administrator enters a simulation name and description, then selects from the pre-built phishing email template library organized by threat category.')
add_figure('Figure_9.9', 'Simulation creation Step 2: selecting target employees from the company roster. Employees can be filtered by department and selected individually or all at once using the bulk selection option.')
add_figure('Figure_9.10', 'Simulation creation Step 3: summary and confirmation page showing the simulation name, the selected template preview, the number of targeted employees, and a confirmation prompt before dispatching emails.')
add_figure('Figure_9.11', 'Simulation creation Step 4: loading screen displayed while the backend processes the simulation and sends phishing emails to all selected employees, with a progress indicator.')
add_table(
    headers=['Step', 'Screen', 'Input Required'],
    rows=[
        ['Step 1', 'Name and Template',   'Simulation name, description, pre-built template selection'],
        ['Step 2', 'Employee Assignment', 'Target employee selection with optional department filter'],
        ['Step 3', 'Summary Review',      'Verify all settings, read confirmation warning, confirm send'],
        ['Step 4', 'Sending Progress',    'Automatic — system processes email dispatch with loading indicator'],
    ],
    caption='TABLE 8.3: Simulation Creation Wizard Steps',
)

add_h2('8.4 Analytics and Reports')
add_body(
    'The analytics dashboard provides real-time insight into the organization\'s '
    'cybersecurity awareness posture. Four KPI cards at the top show average risk '
    'score, campaign completion rate, simulation click rate, and training completion '
    'rate. Two charts display risk score trends over time and risk level distribution '
    'across employees. A second view shows training activity indicators and completion '
    'rates broken down by training type. The dashboard supports time range filters '
    'of 7, 30, and 90 days. During the initial testing phase charts display an empty '
    'state as data accumulates from live campaigns.'
)
add_figure('Figure_9.12', 'Analytics dashboard upper section showing the four KPI cards (Avg Risk Score, Campaign Completion, Simulation Click Rate, Training Completion), the Average Risk Score Over Time line chart, and the Risk Level Distribution chart. Empty state is displayed as the platform is in initial testing.')
add_figure('Figure_9.13', 'Analytics dashboard lower section showing the Security Training Activity panel with Simulation Clicks and Training Completions counters, and the Training Completion Rates bar chart broken down by type: Email Phishing, SMS Scams, and Voice Call Scams.')
add_table(
    headers=['Metric', 'Visualization', 'Description'],
    rows=[
        ['Avg Risk Score',          'KPI card',    'Average risk score across all company employees'],
        ['Campaign Completion',     'KPI card',    'Percentage of simulation campaigns completed'],
        ['Simulation Click Rate',   'KPI card',    'Percentage of employees who clicked simulation links'],
        ['Training Completion',     'KPI card',    'Percentage of assigned training modules completed'],
        ['Risk Score Over Time',    'Line chart',  'Risk score trend across selected time period'],
        ['Risk Level Distribution', 'Pie chart',   'Proportion of Low, Medium, and High risk employees'],
        ['Training Activity',       'Counters',    'Total simulation clicks and training completions'],
        ['Completion Rates',        'Bar chart',   'Training completion rate per module type'],
    ],
    caption='TABLE 8.4: Analytics Dashboard Metrics',
)

add_h2('8.5 Employee Management')
add_body(
    'The employee management section displays all registered employees in a sortable '
    'table. Administrators can invite new employees by entering their name, email, '
    'and department — the system sends an invitation email with a unique registration '
    'link. Clicking an employee\'s record opens a detail view showing their full '
    'profile, assigned trainings, campaign results, and current risk score.'
)
add_figure('Figure_9.14', 'Employee management list table displaying all company employees with columns for name, email, department badge, risk score badge (color-coded Low/Medium/High), number of campaigns received, and action buttons.')
add_figure('Figure_9.15', 'Invite employee modal showing input fields for employee first name, last name, email address, and department. Submitting sends an invitation email containing a unique registration link.')
add_figure('Figure_9.16', 'Employee detail view showing the selected employee\'s full profile including personal information, department, registration date, current risk score, and tabbed sections for training history and campaign participation.')
add_table(
    headers=['Column', 'Description', 'Sortable'],
    rows=[
        ['Name',       'Employee full name',                        'Yes'],
        ['Email',      'Employee email address',                    'Yes'],
        ['Department', 'Assigned department within the company',    'Yes'],
        ['Risk Score', 'Color-coded badge: Low, Medium, or High',   'Yes'],
        ['Campaigns',  'Number of simulation campaigns received',   'Yes'],
        ['Actions',    'View details and manage employee options',  'No'],
    ],
    caption='TABLE 8.5: Employee List Table Columns',
)

add_h2('8.6 Training Management')
add_body(
    'The admin training section presents the three available awareness training modules: '
    'Email Phishing, SMS Scams (Smishing), and Voice Call Scams (Vishing). For each '
    'module the administrator can view full module details including content description, '
    'learning objectives, and quiz information, or assign the module directly to '
    'selected employees. Training assignments are tracked and visible in each '
    'employee\'s detail profile.'
)
add_figure('Figure_9.17', 'Admin training management page showing the three available training modules: Email Phishing, SMS Scams (Smishing), and Voice Call Scams (Vishing), each displaying a description and two action buttons: View Details and Assign to Employee.')
add_figure('Figure_9.18', 'Training module View Details page showing the complete module information including the content description, list of learning objectives, module duration, and associated assessment quiz details.')
add_figure('Figure_9.19', 'Training module Assign to Employee page showing the employee selection interface with checkboxes, department filter, and a confirm assignment button to assign the module to selected employees.')
add_table(
    headers=['Training Module', 'Threat Type', 'Saudi-Specific Examples Covered'],
    rows=[
        ['Email Phishing',         'Email-based attacks',    'Fake Absher emails, SAMA banking alerts, government service impersonation'],
        ['SMS Scams (Smishing)',    'SMS-based attacks',      'Fake Nafath OTP messages, Saudi Post delivery scams, SADAD payment alerts'],
        ['Voice Call Scams (Vishing)', 'Phone-based attacks', 'Ministry of Interior impersonation, bank verification calls, prize claim calls'],
    ],
    caption='TABLE 8.6: Training Modules and Coverage',
)

add_h2('8.7 Admin Profile and Settings')
add_body(
    'The admin profile page provides access to personal account information and '
    'platform settings. The profile section displays name, email address, company '
    'name, and role. The settings section allows configuration of account preferences '
    'and notification options.'
)
add_figure('Figure_9.20', 'Admin profile page showing personal account information (name, email, company, role) and account settings configuration options for preferences and notifications.')

# =============================================================================
#  CHAPTER 9 – WEEK 11
# =============================================================================
doc.add_page_break()
add_h1('9. Frontend Development – Week 11: Employee Portal and Public Portal')
add_body(
    'Week 11 completed the platform with the employee-facing portal and the public '
    'awareness portal. The employee portal provides a personalized experience '
    'including a risk dashboard, phishing identification quiz, training module access, '
    'gamification features, and profile management. The public portal serves as a '
    'free open-access awareness resource requiring no registration, targeting the '
    'general public in Saudi Arabia.'
)
add_table(
    headers=['Task', 'Type', 'Description'],
    rows=[
        ['Build employee dashboard',       'Frontend', 'Personalized homepage with risk score, training progress, gamification'],
        ['Create quiz interface',          'Frontend', 'Phishing identification quiz with scoring and results'],
        ['Build training module UI',       'Frontend', 'Training delivery with video and interactive mode selection'],
        ['Implement gamification display', 'Frontend', 'Badges collection and leaderboard with points breakdown'],
        ['Build public community portal',  'Frontend', 'No-login awareness homepage for general public'],
        ['Create awareness content pages', 'Frontend', 'Educational content for Email Phishing, SMS Scams, Voice Scams'],
        ['Build public quiz interface',    'Frontend', 'Anonymous quiz accessible to all public visitors'],
        ['Final UI/UX polish',             'Frontend', 'Responsive design verification, RTL testing, consistency review'],
    ],
    caption='TABLE 9.1: Week 11 Development Tasks',
)

add_h2('9.1 Employee Dashboard')
add_body(
    'The employee dashboard is the main landing page after login, providing a '
    'personalized overview of the employee\'s cybersecurity awareness status. '
    'It shows a welcome message, the employee\'s current risk score with a visual '
    'indicator, a training progress summary showing completed versus assigned '
    'modules, upcoming training deadlines, and a badge highlights section. '
    'Quick-action buttons link directly to Quizzes, Training, Badges, and the '
    'Leaderboard. The dashboard adapts to mobile screen sizes with a responsive '
    'single-column stacked layout.'
)
add_figure('Figure_10.1', 'Employee dashboard full homepage showing the personalized welcome message, risk score indicator, training progress summary with completed and pending modules, upcoming deadlines, and earned badge highlights.')
add_figure('Figure_10.2', 'Employee dashboard on a mobile device viewport (375px width) demonstrating the responsive layout with vertically stacked widgets and the sidebar replaced by a hamburger menu icon.')

add_h2('9.2 Quiz Interface')
add_body(
    'The phishing identification quiz challenges employees to classify email scenarios '
    'as safe or phishing. The quiz begins with a start screen showing title, '
    'description, and estimated duration. Each question displays a realistic email '
    'mockup the employee must evaluate using the Safe or Phishing buttons. After '
    'completing all questions, a results screen shows the total score, performance '
    'breakdown, and improvement recommendations. Quiz scores contribute to the '
    'employee\'s risk profile and leaderboard points.'
)
add_figure('Figure_10.3', 'Quiz start screen showing the quiz title, a description of the task, the estimated completion time, difficulty level badge, and the Start Quiz button.')
add_figure('Figure_10.4', 'Quiz question screen showing a realistic phishing email scenario (sender, subject, body) with the question number indicator and two large answer buttons: Safe in green and Phishing in red.')
add_figure('Figure_10.5', 'Quiz results screen displaying the final score percentage, a breakdown of performance by question category, personalized improvement recommendations, and options to retake or return to dashboard.')
add_table(
    headers=['Element', 'Description'],
    rows=[
        ['Start Screen',       'Quiz title, description, estimated time, difficulty, Start button'],
        ['Question Display',   'Realistic email mockup with sender name, subject line, and body text'],
        ['Answer Buttons',     'Safe (green) and Phishing (red) — large touch-friendly buttons'],
        ['Progress Indicator', 'Current question number out of total (e.g., Question 3 of 10)'],
        ['Results Screen',     'Total score, category breakdown, and personalized recommendations'],
    ],
    caption='TABLE 9.2: Quiz Interface Components',
)

add_h2('9.3 Training Module Interface')
add_body(
    'The training section allows employees to access their assigned awareness training '
    'modules. Each module page shows the title, content description, learning '
    'objectives, and two delivery mode options: Video Training (watch an educational '
    'video then complete a quiz) and Interactive Learning (step-by-step scenario-based '
    'content with embedded Saudi-specific examples). Both modes include an assessment '
    'quiz that must be passed with a score of 80% or above to mark the module as complete.'
)
add_figure('Figure_10.6', 'Training module page showing the module title, content description, learning objectives list, estimated duration, and the two training mode selection cards (Video Training and Interactive Learning).')
add_figure('Figure_10.7', 'Training mode selection interface presenting Video Training (watch educational video then take quiz) and Interactive Learning (step-by-step scenarios with Saudi-specific examples) as the two available delivery methods.')
add_table(
    headers=['Mode', 'Content Delivery', 'Assessment', 'Pass Requirement'],
    rows=[
        ['Video Training',       'Embedded video player',                  'Post-video comprehension quiz', 'Score >= 80%'],
        ['Interactive Learning', 'Step-by-step scenario-based content',    'Embedded scenario quiz',        'Score >= 80%'],
    ],
    caption='TABLE 9.3: Training Delivery Modes',
)

add_h2('9.4 Gamification Features')
add_body(
    'The gamification system drives sustained engagement through badges and a points-based '
    'leaderboard. Employees earn points for completing training modules, attempting and '
    'passing quizzes, and achieving perfect scores. The badges page displays all '
    'available achievements — earned badges appear in full color while locked badges '
    'are shown in greyscale with their unlock requirement. The leaderboard page shows '
    'the employee\'s own position prominently with Weekly, Monthly, and All Time views, '
    'four stat summary cards, and an explanation of the quiz points formula.'
)
add_figure('Figure_10.8', 'Badges showcase page displaying all available achievement badges. Earned badges are shown in full color with name and description. Locked badges appear in greyscale with the requirement needed to unlock them.')
add_figure('Figure_10.9', 'Leaderboard page showing the Your Position section with three time period cards (Weekly, Monthly, All Time) each displaying the employee\'s rank and points, followed by four stat cards (Participants, Your Rank, Your Points, Period) and the How Quiz Points Work formula explanation.')
add_table(
    headers=['Points Event', 'Points Awarded', 'Description'],
    rows=[
        ['Base quiz attempt',    '+30 pts',       'Awarded for attempting any quiz regardless of score'],
        ['Quiz performance',     '+Score x 0.7',  'Performance bonus based on quiz score percentage'],
        ['Complete training',    '+50 pts',       'Awarded for completing a full training module'],
        ['Pass quiz (>=80%)',    '+25 pts',        'Bonus for passing the assessment quiz'],
        ['Perfect quiz score',   '+50 pts',        'Additional bonus for achieving 100% on any quiz'],
    ],
    caption='TABLE 9.4: Gamification Points System',
)

add_h2('9.5 Employee Profile and Settings')
add_body(
    'The employee profile page provides access to personal account information and '
    'settings preferences. Employees can view their name, email, department, and '
    'role, and configure account preferences from this page.'
)
add_figure('Figure_10.10', 'Employee profile and settings page showing personal account information (name, email, department, role) and account settings configuration options.')

add_h2('9.6 Public Portal')
add_body(
    'The public portal is a free, no-login cybersecurity awareness resource targeting '
    'the general public in Saudi Arabia. It covers the three primary cyber threats '
    'facing Saudi users — Email Phishing, SMS Scams, and Voice Call Scams — with '
    'educational content featuring Saudi-specific real-world examples. The portal is '
    'fully bilingual with complete RTL support for Arabic and is accessible to anyone '
    'without creating an account.'
)

add_h3('9.6.1 Public Homepage')
add_body(
    'The public homepage hero section communicates the platform value proposition '
    'with the headline "Protect Yourself from Cyber Threats" and a description of '
    'free cybersecurity awareness for Saudi Arabia. Two CTA buttons direct visitors '
    'to either start learning or take a free quiz. The page continues with an '
    'educational section presenting the three threat categories as visually distinct '
    'cards with Saudi-specific examples, followed by a statistics section showing '
    'platform adoption.'
)
add_figure('Figure_10.11', 'Public portal homepage hero section with blue gradient background, the headline "Protect Yourself from Cyber Threats", platform description, and two call-to-action buttons: Start Learning and Take Free Quiz.')
add_figure('Figure_10.12', 'Public portal "Learn About Cyber Threats" section with three topic cards: Email Phishing (blue) describing fake Absher, SAMA, and bank emails; SMS Scams/Smishing (green) covering fake Nafath and Saudi Post messages; and Voice Call Scams/Vishing (purple) covering Ministry of Interior impersonation calls.')
add_figure('Figure_10.13', 'Public portal statistics section displaying key platform adoption and impact metrics.')
add_table(
    headers=['Section', 'Content', 'Purpose'],
    rows=[
        ['Hero',          '"Protect Yourself from Cyber Threats", Start Learning + Take Free Quiz', 'Communicate value, guide action'],
        ['Threat Cards',  'Email Phishing, SMS Scams, Voice Scams with Saudi examples',             'Navigate to specific content'],
        ['Statistics',    'Platform adoption metrics',                                              'Build credibility and trust'],
        ['Navigation',    'Home, Training, Quizzes, Community, Language, Login, Register',          'Access all portal sections'],
    ],
    caption='TABLE 9.5: Public Homepage Sections',
)

add_h3('9.6.2 Awareness Content Pages')
add_body(
    'The training content page presents the three awareness modules as cards with '
    'descriptions and Saudi-specific examples — fake Absher and SAMA emails for '
    'phishing, fake Nafath codes and SADAD alerts for smishing, and Ministry of '
    'Interior and bank impersonation calls for vishing. The full page is available '
    'in Arabic with complete RTL transformation.'
)
add_figure('Figure_10.14', 'Public awareness training page in English showing three module cards: Email Phishing (blue), SMS Scams/Smishing (green), and Voice Call Scams/Vishing (purple), each with threat description, Saudi-specific common examples, and a Learn More button.')
add_figure('Figure_10.15', 'Public awareness training page in Arabic with complete right-to-left layout: Arabic text, right-aligned card content, mirrored navigation, and the same three module cards displayed in RTL format.')

add_h3('9.6.3 Public Quiz Interface')
add_body(
    'The public quiz requires no account or login. The landing page presents three '
    'quiz options (Email Phishing Quiz, SMS Scams Quiz, Voice Scams Quiz) each '
    'containing 10 questions at Beginner difficulty, taking approximately 10 minutes. '
    'After completing a quiz, the results page shows the score and encourages '
    'registration for personalized training.'
)
add_figure('Figure_10.16', 'Public quiz landing page "Test Your Knowledge" with a blue hero section, Free Cybersecurity Awareness badge, and three quiz selection cards: Email Phishing Quiz, SMS Scams Quiz, and Voice Scams Quiz — each showing 10 questions, 10 minutes, Beginner difficulty. No login required.')
add_figure('Figure_10.17', 'Public quiz question screen showing a multiple-choice question with four answer options, a progress bar indicating current question position, and a Submit Answer button. Accessible without registration.')
add_figure('Figure_10.18', 'Public quiz results screen showing the final score, performance breakdown by threat category, and a call-to-action encouraging the visitor to register for personalized training and tracking.')
add_table(
    headers=['Quiz Option', 'Questions', 'Duration', 'Threat Focus'],
    rows=[
        ['Email Phishing Quiz', '10', '~10 min', 'Identifying fake emails from Saudi organizations'],
        ['SMS Scams Quiz',      '10', '~10 min', 'Recognizing fake Nafath, Saudi Post, SADAD messages'],
        ['Voice Scams Quiz',    '10', '~10 min', 'Detecting impersonation calls from fake authorities'],
    ],
    caption='TABLE 9.6: Public Quiz Options',
)
add_table(
    headers=['Feature', 'Public User', 'Registered Employee'],
    rows=[
        ['Login Required',       'No',            'Yes'],
        ['Score Saved',          'Session only',  'Saved to database'],
        ['Risk Score Impact',    'None',           'Contributes to personal risk score'],
        ['Gamification',         'None',           'Points, badges, leaderboard ranking'],
        ['Recommendations',      'Generic',        'Personalized based on performance'],
    ],
    caption='TABLE 9.7: Public vs. Employee Quiz Comparison',
)

# =============================================================================
#  CHAPTER 10 – SYSTEM INTEGRATION
# =============================================================================
doc.add_page_break()
add_h1('10. System Integration')
add_body(
    'This chapter describes how the React.js frontend (Chapters 6-9) integrates '
    'with the Django REST Framework backend (Chapters 1-5). All inter-layer '
    'communication occurs over HTTPS using JSON-encoded REST API requests via '
    'the centralized Axios service layer.'
)

add_h2('10.1 JWT Authentication Flow')
add_body(
    'On successful login the backend returns an access token (15-minute lifetime) '
    'and a refresh token (7-day lifetime). Both are stored in localStorage. Every '
    'API request carries the access token as a Bearer header via the Axios request '
    'interceptor. When the access token expires the response interceptor silently '
    'refreshes it and retries the original request. If refresh also fails the user '
    'is redirected to login.'
)
add_table(
    headers=['Step', 'Action', 'Component'],
    rows=[
        ['1', 'User submits credentials',                        'LoginPage.jsx'],
        ['2', 'POST /api/v1/auth/login/ called',                 'auth.js service'],
        ['3', 'Backend validates, returns JWT access + refresh', 'Django auth view'],
        ['4', 'Tokens saved to localStorage',                    'auth.js service'],
        ['5', 'User redirected to role portal',                  'React Router + AuthContext'],
        ['6', 'Requests include Bearer token in header',         'Axios request interceptor'],
        ['7', 'Expired token silently refreshed',                'Axios response interceptor'],
    ],
    caption='TABLE 10.1: JWT Authentication Flow Steps',
)

add_h2('10.2 Key Integration Points')
add_table(
    headers=['Frontend Component', 'Endpoint', 'Method', 'Data Flow'],
    rows=[
        ['Login Page',          '/api/v1/auth/login/',                 'POST', 'Credentials -> JWT tokens'],
        ['Register Page',       '/api/v1/auth/register/',              'POST', 'Company + admin data -> 201'],
        ['Email Verify',        '/api/v1/auth/verify-email/<uuid>/',    'POST', 'Token -> account activated'],
        ['Campaigns List',      '/api/v1/campaigns/',                  'GET',  'Request -> campaign list'],
        ['Campaign Create',     '/api/v1/campaigns/',                  'POST', 'Form -> campaign record'],
        ['Simulation Send',     '/api/v1/simulations/{id}/send/',       'POST', 'Config -> email dispatch'],
        ['Analytics',           '/api/v1/analytics/overview/',         'GET',  'Period -> aggregated stats'],
        ['Employee List',       '/api/v1/employees/',                  'GET',  'Request -> employee list'],
        ['Invite Employee',     '/api/v1/employees/invite/',           'POST', 'Data -> invitation email'],
        ['Training Modules',    '/api/v1/training/modules/',           'GET',  'Request -> module list'],
        ['Quiz Submit',         '/api/v1/training/submit/',            'POST', 'Answers -> score + badges'],
        ['Leaderboard',         '/api/v1/gamification/leaderboard/',   'GET',  'Period -> ranked list'],
        ['Public Quiz',         '/api/v1/training/public-quiz/',       'GET',  'No auth -> questions'],
    ],
    caption='TABLE 10.2: Frontend-Backend Integration Points',
)

add_h2('10.3 Error Handling Strategy')
add_body(
    'Errors are handled at two levels. The Axios interceptor handles HTTP 401 globally '
    'via token refresh. Component-level handlers display HTTP 400 validation errors '
    'as inline field messages, HTTP 403 errors as permission banners, and HTTP 500 '
    'errors as generic retry toasts. All messages are displayed in the user\'s '
    'active language.'
)

# =============================================================================
#  SAVE
# =============================================================================
doc.save(OUTPUT_DOC)
print(f'Done: {OUTPUT_DOC}')
print('Chapters: 10 (Backend 1-5 + Design 6 + Frontend 7-9 + Integration 10)')
print('Figures : 50 embedded from screenshots/')
print('Tables  : 33')
