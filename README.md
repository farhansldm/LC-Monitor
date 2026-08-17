# LC Monitor

> **Internal Employee Time & Attendance Tracking System for AIIDA**
> Built with React 18 + Vite + Supabase + Chrome Extension

---

## Project Overview

LC Monitor is a full-stack workforce monitoring web application. It tracks employee work hours, attendance, breaks, browser activity, and screenshots — with real-time chat, kanban tasks, policies, reports, and role-based access for Employees, Managers, HR Managers, and Administrators.

```
Web Dashboard (React/Vite)  ◄──►  Supabase (PostgreSQL + Edge Functions)  ◄──►  Chrome Extension
```

**Active Supabase project:** `ivipigucanknjjvmnble`  
To point at a different project, see **`DEPLOYMENT.md`**. Do not commit `.env`.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite |
| UI | ShadCN UI + Tailwind CSS |
| State | TanStack React Query v5 |
| Routing | React Router DOM v6 |
| Charts | Recharts |
| Real-time | Supabase Realtime (WebSockets) |
| Voice/Video | WebRTC (peer-to-peer) |
| Backend | Supabase Edge Functions (Deno/TypeScript) |
| Database | PostgreSQL (Supabase) |
| Auth | Custom JWT (not Supabase Auth SDK) |
| Extension | Chrome Extension MV3 |

---

## Quick Start (Local Development)

### Prerequisites
- Node.js ≥ 18
- npm

### Setup

```bash
# 1. Clone
git clone https://github.com/farhansldm/LC-Monitor.git
cd LC-Monitor

# 2. Install dependencies
npm install

# 3. Environment
#    cp .env.example .env
#    Fill VITE_SUPABASE_URL, VITE_SUPABASE_PROJECT_ID, VITE_SUPABASE_PUBLISHABLE_KEY
#    DO NOT commit .env
#    See DEPLOYMENT.md if this is a new Supabase account

# 4. Start dev server
npm run dev
# → http://localhost:8080
```

> In development, the app calls Supabase Edge Functions **directly** (no proxy needed).  
> In production, API calls route through `public/supabase-proxy.php` on the web server.

---

## User Roles

| Role | Access |
|------|--------|
| `EMPLOYEE` | Dashboard, My Workday, Timesheet, Attendance, Leave, Policies, Chats, Tasks |
| `MANAGER` | + Team overview, Browser History, Screenshots, Leave approvals, Reports |
| `HR_MANAGER` | Same admin-level access as ADMIN for HR modules (users, departments, policies, analytics, audit) |
| `ADMIN` | Full admin panel: Users, Teams, Departments, Shifts, Analytics, Audit Logs, Trusted IPs |

---

## Features

| Area | What it does |
|------|----------------|
| Clock in / out / breaks | Session tracking with IP capture, WFH vs Site classification, late/early flags vs assigned shift |
| Attendance | Calendar, corrections, CSV export |
| Leave | Employee submit; manager/admin approve or reject |
| Shifts | Admin creates shifts and assigns them; employee sees times on the workday card |
| Timesheet | Session history, notes, manager comments, CSV export |
| Reports | Date/employee/department filters, hours/breaks/IP/WFH, CSV export |
| Analytics | Monthly KPIs (hours, late/early, WFH vs Site, leave) |
| Policies | Employees read company policies; admin CRUD |
| Departments | Admin CRUD; users can be assigned a department |
| Audit logs | Paginated event log with date and user filters |
| Trusted IPs | Admin-configured CIDR ranges used for SITE vs WFH |
| Chat + tasks | Real-time chat, WebRTC calls, kanban tasks |
| Monitoring | Screenshots and browser history (duration + web-login activate) |
| Assistant | In-app assistant wired to live attendance and timesheet data |
| Theme | Dark/light toggle persisted in `localStorage` |
| Email | Leave decisions, missed clock-out (8pm), daily hours (7am) via Resend or stub |

---

## Project Structure

```
Lc-Monitor-main/
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   └── ThemeContext.tsx
│   ├── components/
│   │   ├── AppLayout.tsx
│   │   ├── AppSidebar.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── chat/
│   ├── lib/
│   │   ├── auth.ts
│   │   ├── roles.ts
│   │   ├── work-sessions-api.ts
│   │   ├── attendance-api.ts
│   │   ├── leave-api.ts
│   │   ├── shifts-api.ts
│   │   ├── reports-api.ts
│   │   ├── policies-api.ts
│   │   ├── admin-api.ts
│   │   ├── chat-api.ts
│   │   ├── tasks-api.ts
│   │   └── assistant.ts
│   └── pages/
│       ├── LoginPage.tsx
│       ├── Dashboard.tsx
│       ├── EmployeeDashboardPage.tsx
│       ├── TimesheetPage.tsx
│       ├── AttendancePage.tsx
│       ├── LeaveRequestsPage.tsx
│       ├── ReportsPage.tsx
│       ├── PoliciesPage.tsx
│       ├── BrowserHistoryPage.tsx
│       ├── ScreenshotsPage.tsx
│       ├── ChatsPage.tsx
│       ├── TasksPage.tsx
│       ├── TeamPage.tsx
│       └── admin/
│           ├── AdminUsersPage.tsx
│           ├── AdminTeamsPage.tsx
│           ├── BrowserHistoryPage.tsx
│           ├── ShiftSchedulingPage.tsx
│           ├── DepartmentsPage.tsx
│           ├── AnalyticsPage.tsx
│           ├── AuditLogsPage.tsx
│           └── IpConfigPage.tsx
├── supabase/
│   ├── functions/
│   │   ├── auth/index.ts
│   │   ├── work-sessions/index.ts   ← clock, leave, shifts, reports, analytics, notes, manager comments
│   │   ├── admin/index.ts           ← users, teams, departments, policies, IP ranges, audit logs
│   │   ├── notifications/index.ts   ← Resend (or stub): leave, missed clock-out, daily summary
│   │   ├── chat/index.ts
│   │   └── tasks/index.ts
│   └── migrations/
├── extension/
│   ├── manifest.json
│   ├── background.js
│   ├── popup.html / popup.js
│   └── config.js
├── public/
│   └── supabase-proxy.php           ← production CORS proxy
├── README.md
└── DEPLOYMENT.md
```

---

## Routes

| Path | Page | Roles |
|------|------|-------|
| `/login` | Login | Public |
| `/` | Dashboard (role-switching) | All |
| `/employee` | My Workday (Clock In/Out) | All |
| `/timesheet` | Session History | All |
| `/attendance` | Attendance Calendar + Corrections | All |
| `/leave` | Leave Requests | All |
| `/reports` | Filtered reports + CSV | MANAGER, ADMIN, HR_MANAGER |
| `/policies` | Company policies | All (write: ADMIN / HR_MANAGER) |
| `/chats` | Real-time Chat + WebRTC Calls | All |
| `/tasks` | Kanban Tasks | All |
| `/team` | Team Overview | MANAGER, ADMIN, HR_MANAGER |
| `/browser-history` | Browser History | MANAGER, ADMIN, HR_MANAGER |
| `/screenshots` | Screenshots | MANAGER, ADMIN, HR_MANAGER |
| `/admin` | Admin Panel | ADMIN, HR_MANAGER |
| `/admin/users` | User Management | ADMIN, HR_MANAGER |
| `/admin/teams` | Team Management | ADMIN, HR_MANAGER |
| `/admin/browser-history` | Admin Browser History | ADMIN, HR_MANAGER |
| `/admin/shifts` | Shift Scheduling | ADMIN, HR_MANAGER |
| `/admin/departments` | Departments | ADMIN, HR_MANAGER |
| `/admin/analytics` | Analytics KPIs | ADMIN, HR_MANAGER |
| `/admin/audit-logs` | Audit Logs | ADMIN, HR_MANAGER |
| `/admin/ip-config` | Trusted office IP ranges | ADMIN, HR_MANAGER |

---

## Database (PostgreSQL via Supabase)

**Core tables:** `users`, `teams`, `work_sessions`, `breaks`, `attendance`, `attendance_corrections`, `browser_history`, `screenshots`, `chat_groups`, `chat_members`, `chat_messages`, `tasks`, `task_activity`, `devices`, `events`

**Sprint tables:** `departments`, `shifts`, `user_shifts`, `leave_requests`, `policies`, `office_ip_ranges`

**Session extras:** `ip_address`, `login_type` (`WFH` / `SITE`), `late_flag`, `early_flag`, `notes`, `manager_comment`

---

## Chrome Extension

The extension (`extension/`) is a Chrome MV3 service worker that:
- Takes screenshots every **15 minutes** (`chrome.alarms`) → Edge Function → Storage
- Tracks **tab-focus duration** and flushes history every 60 seconds via `chrome.alarms`
- Activates from the **web dashboard login** (`content.js` + `ACTIVATE_MONITORING`) as well as the popup

**To load in Chrome:**
1. Open `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension/` folder

Optional: set `VITE_EXTENSION_ID` to the unpacked ID and rebuild the web app.

---

## Deployment

See **`DEPLOYMENT.md`** for the full runbook (build, SQL, functions, Resend, cron, extension).

### Build
```bash
npm run build
# Output: dist/
# Upload dist/ to web server (include public/supabase-proxy.php)
```

### Edge Functions
```bash
supabase functions deploy work-sessions
supabase functions deploy admin
supabase functions deploy auth
supabase functions deploy chat
supabase functions deploy tasks
supabase functions deploy notifications
```

### Database Migrations
```bash
supabase db push
# OR paste SQL into Supabase dashboard → SQL Editor
```

Apply all files in `supabase/migrations/`, including:
- `20260812_001` departments, then `20260812000200`–`005` (shifts, leave, policies, IP/flags)
- `20260813_001_hr_manager_role.sql`
- `20260814_001_manager_comment.sql`

### Production proxy
In production, the frontend calls `/supabase-proxy.php?path=work-sessions` instead of calling Supabase directly. The proxy lives at `public/supabase-proxy.php` and must be deployed with the site.

---

## Sprint Status

**5-Day Completion Sprint — Started Aug 12, 2026**

| Day | Theme | Status |
|-----|-------|--------|
| Day 1 | DB Foundation + IP/WFH Classification | Done |
| Day 2 | Leave Requests + Shift Scheduling + HR Manager | Done |
| Day 3 | Departments + Reports + Analytics + CSV | Done |
| Day 4 | Notes + Comments + Policies + Audit + IP Config | Done |
| Day 5 | Dark Mode + Notifications + Extension polish + Deploy | Done |

> See **`DEPLOYMENT.md`** for production steps.
