# LC Monitor

> **Internal Employee Time & Attendance Tracking System for AIIDA**
> Built with React 18 + Vite + Supabase + Chrome Extension

---

## 📌 Project Overview

LC Monitor is a full-stack workforce monitoring web application. It tracks employee work hours, attendance, breaks, browser activity, and screenshots — with real-time chat, kanban tasks, and role-based access for Employees, Managers, and Administrators.

```
Web Dashboard (React/Vite)  ◄──►  Supabase (PostgreSQL + Edge Functions)  ◄──►  Chrome Extension
```

**Active Supabase Project:** `fnojavvttewlritnqgiz`
**Supabase URL:** `https://fnojavvttewlritnqgiz.supabase.co`

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite |
| UI | ShadCN UI + Tailwind CSS |
| State | TanStack React Query v5 |
| Routing | React Router DOM v6 |
| Real-time | Supabase Realtime (WebSockets) |
| Voice/Video | WebRTC (peer-to-peer) |
| Backend | Supabase Edge Functions (Deno/TypeScript) |
| Database | PostgreSQL (Supabase) |
| Auth | Custom JWT (not Supabase Auth SDK) |
| Extension | Chrome Extension MV3 |

---

## ⚡ Quick Start (Local Development)

### Prerequisites
- Node.js ≥ 18
- npm

### Setup

```bash
# 1. Clone
git clone <repo-url>
cd Lc-Monitor-main

# 2. Install dependencies
npm install

# 3. Environment — already configured in .env
#    Active project: fnojavvttewlritnqgiz
#    Anon key is set. DO NOT commit changes to .env

# 4. Start dev server
npm run dev
# → http://localhost:8080
```

> In development, the app calls Supabase Edge Functions **directly** (no proxy needed).
> In production, all API calls route through `supabase-proxy.php` on the web server.

---

## 👥 User Roles

| Role | Access |
|------|--------|
| `EMPLOYEE` | Dashboard, My Workday, Timesheet, Attendance, Chats, Tasks |
| `MANAGER` | + Team overview, Browser History, Screenshots, Leave approvals, Reports |
| `ADMIN` | + Full admin panel: Users, Teams, Departments, Shifts, Analytics, Audit Logs, Policies |

---

## 📁 Project Structure

```
Lc-Monitor-main/
├── src/
│   ├── App.tsx                    ← Routes
│   ├── main.tsx                   ← Entry point
│   ├── index.css                  ← Design system tokens
│   ├── contexts/
│   │   └── AuthContext.tsx        ← Auth state
│   ├── components/
│   │   ├── AppLayout.tsx
│   │   ├── AppSidebar.tsx         ← Role-aware navigation
│   │   ├── ProtectedRoute.tsx
│   │   └── chat/                  ← Chat UI components
│   ├── lib/                       ← API modules
│   │   ├── auth.ts
│   │   ├── work-sessions-api.ts
│   │   ├── attendance-api.ts      ← New (Aug 12)
│   │   ├── admin-api.ts
│   │   ├── chat-api.ts
│   │   └── tasks-api.ts
│   └── pages/
│       ├── LoginPage.tsx
│       ├── Dashboard.tsx
│       ├── EmployeeDashboardPage.tsx
│       ├── TimesheetPage.tsx
│       ├── AttendancePage.tsx     ← Fully rebuilt (Aug 12)
│       ├── BrowserHistoryPage.tsx
│       ├── ScreenshotsPage.tsx
│       ├── ChatsPage.tsx
│       ├── TasksPage.tsx
│       ├── TeamPage.tsx
│       └── admin/
│           ├── AdminUsersPage.tsx
│           ├── AdminTeamsPage.tsx
│           └── BrowserHistoryPage.tsx
├── supabase/
│   ├── functions/
│   │   ├── auth/index.ts          ← Login, signup, /me
│   │   ├── work-sessions/index.ts ← Clock in/out, breaks, attendance, history
│   │   ├── admin/index.ts         ← Users, teams, stats
│   │   ├── chat/index.ts
│   │   └── tasks/index.ts
│   └── migrations/                ← 17 migration SQL files
├── extension/
│   ├── manifest.json              ← Chrome Extension MV3
│   ├── background.js              ← Screenshots + browser history
│   ├── popup.html / popup.js
│   └── config.js
├── .env                           ← Supabase credentials (DO NOT COMMIT)
├── project_analysis.md            ← 📖 Full project reference (READ THIS)
├── 5_day_plan.md                  ← 📋 Current sprint plan
└── updated req.md                 ← 📄 Full requirements (18 sections)
```

---

## 🗺️ Routes

| Path | Page | Roles |
|------|------|-------|
| `/login` | Login | Public |
| `/` | Dashboard (role-switching) | All |
| `/employee` | My Workday (Clock In/Out) | All |
| `/timesheet` | Session History | All |
| `/attendance` | Attendance Calendar + Corrections | All |
| `/chats` | Real-time Chat + WebRTC Calls | All |
| `/tasks` | Kanban Tasks | All |
| `/team` | Team Overview | MANAGER, ADMIN |
| `/browser-history` | Browser History | MANAGER, ADMIN |
| `/screenshots` | Screenshots | MANAGER, ADMIN |
| `/admin` | Admin Panel | ADMIN |
| `/admin/users` | User Management | ADMIN |
| `/admin/teams` | Team Management | ADMIN |
| `/admin/browser-history` | Admin Browser History | ADMIN |

**Coming soon (5-day sprint):**
`/leave`, `/reports`, `/policies`, `/admin/shifts`, `/admin/departments`, `/admin/analytics`, `/admin/audit-logs`, `/admin/ip-config`

---

## 🗄️ Database (PostgreSQL via Supabase)

**Current tables:** `users`, `teams`, `work_sessions`, `breaks`, `attendance`, `attendance_corrections`, `browser_history`, `screenshots`, `chat_groups`, `chat_members`, `chat_messages`, `tasks`, `task_activity`, `devices`, `events`

**Migrations needed (Day 1 of sprint):** `departments`, `shifts`, `user_shifts`, `leave_requests`, `policies`, `office_ip_ranges` + columns on `work_sessions` (`ip_address`, `login_type`, `late_flag`, `early_flag`)

---

## 🔌 Chrome Extension

The extension (`extension/`) is a Chrome MV3 service worker that:
- Takes screenshots every **15 minutes** → uploads to Supabase Storage → inserts into `screenshots` table
- Tracks browser history via `chrome.history.onVisited` → batches and sends every 60 seconds

**To load in Chrome:**
1. Open `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension/` folder

---

## 🚀 Deployment

### Build
```bash
npm run build
# Output: dist/
# Upload dist/ to web server
```

### Edge Functions
```bash
supabase functions deploy work-sessions
supabase functions deploy admin
supabase functions deploy auth
supabase functions deploy chat
supabase functions deploy tasks
```

### Database Migrations
```bash
supabase db push
# OR paste SQL into Supabase dashboard → SQL Editor
```

### ⚠️ Important: Production Requires `supabase-proxy.php`
In production, the frontend calls `/supabase-proxy.php?path=work-sessions` (PHP reverse proxy) instead of calling Supabase directly, to solve CORS. This file must exist on the web server. Contact **Mantasha** (previous developer) or the server admin for this file.

---

## 📋 Current Sprint Status

**5-Day Completion Sprint — Started Aug 12, 2026**

| Day | Theme | Status |
|-----|-------|--------|
| Day 1 | DB Foundation + IP/WFH Classification | ⬜ Pending |
| Day 2 | Leave Requests + Shift Scheduling | ⬜ Pending |
| Day 3 | Departments + Reports + Analytics + CSV | ⬜ Pending |
| Day 4 | Notes + Comments + Policies + Audit + IP Config | ⬜ Pending |
| Day 5 | Dark Mode + Notifications + Polish + Deploy | ⬜ Pending |

> See `5_day_plan.md` for detailed task breakdown per day.
> See `project_analysis.md` for the full file map, API reference, design patterns, and progress tracker.

---

## 📖 Key Documents

| File | Purpose |
|------|---------|
| `project_analysis.md` | **Full project reference** — file map, API endpoints, DB tables, design patterns, known issues, progress tracker |
| `5_day_plan.md` | **Current sprint plan** — day-by-day tasks, files to create, deliverables |
| `updated req.md` | **Full requirements** — all 18 sections from the client |

---

## ⚠️ Known Issues

| Issue | Severity |
|-------|---------|
| Extension `duration_seconds` is always 0 | 🟡 Medium |
| Extension POSTs to Supabase REST directly, not Edge Function | 🟡 Medium |
| Employee `/` dashboard card shows static placeholder data | 🟡 Medium |
| Admin Browser History page has no filters | 🟡 Low |
| `supabase-proxy.php` not in repo — needed for production | 🟠 High |
