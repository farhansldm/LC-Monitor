# LC Monitor — Complete Project Reference & Progress Tracker

> **Last updated:** August 12, 2026
> **Active developer handoff:** Transferring to Cursor IDE
> **Current sprint:** 5-Day Completion Sprint (see `5_day_plan.md`)
> **Active Supabase project:** `fnojavvttewlritnqgiz`

---

## 🏗️ What Is This Project?

**LC Monitor** is a secure, cloud-based internal **Employee Time & Attendance Tracking System** for AIIDA. It tracks work hours, attendance, breaks, browser activity, screenshots, tasks, and internal communications — with role-based access for Employees, Managers, and Admins.

### Architecture

```
┌─────────────────────────────┐     ┌──────────────────────────────────────┐     ┌─────────────────────┐
│   Web Dashboard             │     │   Supabase Backend                   │     │   Chrome Extension  │
│   React 18 + Vite           │◄───►│   PostgreSQL + Deno Edge Functions   │◄───►│   MV3 Service Worker│
│   (this repo: src/)         │     │   (this repo: supabase/)             │     │   (this repo: ext/) │
└─────────────────────────────┘     └──────────────────────────────────────┘     └─────────────────────┘
```

---

## 🛠️ Technology Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | React 18, TypeScript, Vite | |
| UI Components | ShadCN UI (Radix UI primitives) | |
| Styling | Tailwind CSS + custom CSS tokens | Dark-only theme currently |
| State / Data | TanStack React Query v5 | All API calls go through `useQuery`/`useMutation` |
| Routing | React Router DOM v6 | |
| Real-time | Supabase Realtime (WebSockets) | Used in ChatsPage |
| Voice/Video | WebRTC (peer-to-peer) | Implemented in `useWebRTC.ts` |
| Backend | Supabase Edge Functions (Deno) | TypeScript |
| Database | PostgreSQL via Supabase | |
| Auth | Custom JWT (Edge Functions + localStorage) | **Not** Supabase Auth SDK |
| Extension | Chrome Extension MV3 | `extension/` folder |

---

## 🔐 Environment Variables

**File:** `.env` (in repo root, not committed to git — keep secret)

```env
VITE_SUPABASE_PROJECT_ID="fnojavvttewlritnqgiz"
VITE_SUPABASE_URL="https://fnojavvttewlritnqgiz.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  ← anon key (already set ✅)
```

> ⚠️ The old project `cuawkttwzfpjtqwjaybu` is commented out. The **active** project is `fnojavvttewlritnqgiz`.

**Supabase Edge Function secrets** (set via `supabase secrets set`):
- `SUPABASE_URL` — set automatically
- `SUPABASE_SERVICE_ROLE_KEY` — set automatically
- `JWT_SECRET` — must match what was used when creating users
- `RESEND_API_KEY` — needed for email notifications (Day 5 of sprint)

---

## 👥 User Roles

| Role | Can Access |
|------|-----------|
| `EMPLOYEE` | Dashboard, My Workday, Timesheet, Attendance, Chats, Tasks |
| `MANAGER` | + Team overview, Browser History, Screenshots, Leave approvals |
| `ADMIN` | + Admin panel (Users, Teams, Departments, Shifts, Policies, Analytics, Audit Logs) |

---

## 📁 Complete File Map

### Root
| File | Purpose | Status |
|------|---------|--------|
| `.env` | Environment config | ✅ Anon key set — active project `fnojavvttewlritnqgiz` |
| `package.json` | Dependencies | ✅ |
| `vite.config.ts` | Build config | ✅ |
| `tailwind.config.ts` | Design tokens | ✅ |
| `index.html` | App entry | ✅ |
| `5_day_plan.md` | **Current sprint plan** | ✅ Read this next |
| `updated req.md` | Updated requirements (all 18 sections) | ✅ |
| `project_analysis.md` | **This file** | ✅ |

---

### `src/` — Frontend

#### Core
| File | Purpose | Status |
|------|---------|--------|
| `src/App.tsx` | Routes + layout wrapper | ✅ All current routes wired |
| `src/main.tsx` | React entry, providers | ✅ |
| `src/index.css` | Global CSS, design tokens, utility classes | ✅ Dark theme |

#### `src/contexts/`
| File | Purpose | Status |
|------|---------|--------|
| `AuthContext.tsx` | Auth state, `useAuth()` hook, user object | ✅ |

#### `src/components/`
| File | Purpose | Status |
|------|---------|--------|
| `AppLayout.tsx` | Sidebar + main content layout | ✅ |
| `AppSidebar.tsx` | Navigation sidebar (role-filtered) | ✅ All current nav items present |
| `NavLink.tsx` | Active-aware sidebar link | ✅ |
| `ProtectedRoute.tsx` | Redirects unauthenticated users to `/login` | ✅ |
| `chat/CallScreen.tsx` | Voice/video call full-screen UI | ✅ |
| `chat/ChatMessage.tsx` | Chat message bubble | ✅ |
| `chat/ChatPanel.tsx` | Chat panel with messages + input | ✅ |
| `chat/ChatQuickActions.tsx` | Call/action buttons in chat | ✅ |
| `chat/ChatWidget.tsx` | Floating chat widget | ✅ |
| `chat/IncomingCallDialog.tsx` | Incoming call dialog | ✅ |

#### `src/lib/` — API Layer
> All API modules follow the same pattern: proxy via `supabase-proxy.php` in production, direct Edge Function URL in dev.

| File | Purpose | Status |
|------|---------|--------|
| `auth.ts` | `login()`, `logout()`, `getAuthHeaders()`, `getStoredUser()` | ✅ |
| `admin-api.ts` | `getUsers()`, `createUser()`, `getStats()` | ✅ |
| `chat-api.ts` | Groups, messages, direct chat | ✅ |
| `tasks-api.ts` | Kanban tasks CRUD | ✅ |
| `work-sessions-api.ts` | Clock in/out, breaks, browser history, screenshots | ✅ |
| `attendance-api.ts` | Monthly attendance, corrections (submit + review) | ✅ **New — built Aug 12** |
| `extension-activate.ts` | Sends login token to Chrome Extension via `chrome.runtime.sendMessage` | ✅ |
| `utils.ts` | `cn()` classname helper | ✅ |

#### `src/pages/` — Pages & Routes

| File | Route | Roles | Status |
|------|-------|-------|--------|
| `LoginPage.tsx` | `/login` | Public | ✅ Full |
| `Dashboard.tsx` | `/` | All | ✅ Role-switching; Employee card **still has static placeholder** (Day 4 of sprint) |
| `EmployeeDashboardPage.tsx` | `/employee` | All | ✅ Full — clock in/out, breaks, live timer |
| `TimesheetPage.tsx` | `/timesheet` | All | ✅ Session history + notes |
| `AttendancePage.tsx` | `/attendance` | All | ✅ **Fully rebuilt Aug 12** — calendar, stats, corrections, manager review |
| `ChatsPage.tsx` | `/chats` | All | ✅ Real-time chat + WebRTC calls |
| `TasksPage.tsx` | `/tasks` | All | ✅ Kanban board |
| `BrowserHistoryPage.tsx` | `/browser-history` | MANAGER, ADMIN | ✅ Full — filters, timeline, domain breakdown |
| `ScreenshotsPage.tsx` | `/screenshots` | MANAGER, ADMIN | ✅ Full — built previously |
| `TeamPage.tsx` | `/team` | MANAGER, ADMIN | 🟡 Functional but basic styling |
| `AdminPage.tsx` | `/admin` | ADMIN | ✅ Nav only |
| `admin/AdminUsersPage.tsx` | `/admin/users` | ADMIN | ✅ Full CRUD |
| `admin/AdminTeamsPage.tsx` | `/admin/teams` | ADMIN | ✅ Full |
| `admin/BrowserHistoryPage.tsx` | `/admin/browser-history` | ADMIN | 🟡 Basic — no filters |
| `NotFound.tsx` | `*` | — | ✅ |

**Pages to create in the 5-day sprint:**
| File | Route | Day |
|------|-------|-----|
| `src/pages/LeaveRequestsPage.tsx` | `/leave` | Day 2 |
| `src/pages/ReportsPage.tsx` | `/reports` | Day 3 |
| `src/pages/PoliciesPage.tsx` | `/policies` | Day 4 |
| `src/pages/admin/ShiftSchedulingPage.tsx` | `/admin/shifts` | Day 2 |
| `src/pages/admin/DepartmentsPage.tsx` | `/admin/departments` | Day 3 |
| `src/pages/admin/AnalyticsPage.tsx` | `/admin/analytics` | Day 3 |
| `src/pages/admin/AuditLogsPage.tsx` | `/admin/audit-logs` | Day 4 |
| `src/pages/admin/IpConfigPage.tsx` | `/admin/ip-config` | Day 4 |

---

### `supabase/` — Backend

#### Edge Functions (`supabase/functions/`)

| Function | Endpoints (current) | Status |
|----------|-------------------|--------|
| `auth` | `POST /login`, `POST /signup`, `GET /me` | ✅ |
| `work-sessions` | `GET /status`, `POST /clock-in`, `POST /clock-out`, `POST /break-in`, `POST /break-out`, `GET /active-now`, `GET /team-overview`, `GET /history`, `PATCH /notes`, `GET /browser-history`, `POST /browser-history`, `POST /screenshot-upload`, `GET /screenshots`, `GET /attendance`, `GET /attendance/corrections/mine`, `POST /attendance/corrections`, `GET /attendance/corrections/all`, `PATCH /attendance/corrections/:id/review` | ✅ |
| `admin` | `GET /stats`, `GET /users`, `POST /users`, `PATCH /users/:id`, `GET /teams`, `POST /teams`, `PATCH /teams/:id/members` | ✅ |
| `chat` | `/groups`, `/groups/:id/members`, `/groups/:id/messages`, `/search`, `/direct` | ✅ |
| `tasks` | `GET/POST /tasks`, `GET /activity` | ✅ |

**Endpoints to add in sprint:**
| Endpoint | Function | Day |
|----------|---------|-----|
| `GET /leave/mine`, `POST /leave`, `GET /leave/all`, `PATCH /leave/:id/review` | `work-sessions` | Day 2 |
| `GET /shifts/mine`, `GET /shifts`, `POST /shifts`, `POST /shifts/assign` | `work-sessions` | Day 2 |
| `GET /reports` | `work-sessions` | Day 3 |
| `GET /analytics` | `work-sessions` | Day 3 |
| `PATCH /manager-comment` | `work-sessions` | Day 4 |
| Department CRUD, Policy CRUD, Audit logs, IP ranges | `admin` | Days 3–4 |

#### Database (`supabase/migrations/`)

**Tables that EXIST now:**
| Table | Notes |
|-------|-------|
| `users` | `id, email, password_hash, first_name, last_name, role, team_id, status` |
| `teams` | `id, name, manager_id` |
| `work_sessions` | `id, user_id, date, start_time, end_time, total_active_seconds, source, notes` |
| `breaks` | `id, session_id, user_id, break_start, break_end, duration_seconds, date` |
| `attendance` | `id, user_id, date, status (PRESENT/ABSENT/LEAVE/HOLIDAY), total_work_seconds, notes` |
| `attendance_corrections` | `id, user_id, date, reason, status (PENDING/APPROVED/REJECTED), reviewer_id, reviewed_at` |
| `browser_history` | `id, user_id, session_id, url, domain, title, duration_seconds, visited_at` |
| `screenshots` | `id, user_id, storage_path, taken_at, is_blurred` |
| `chat_groups`, `chat_members`, `chat_messages` | Full chat schema |
| `tasks`, `task_activity` | Kanban tasks |
| `devices`, `events` | Extension device tracking |

**Tables to CREATE in sprint (Day 1 migrations):**
| Table | Migration File | Day |
|-------|--------------|-----|
| `departments` | `20260812_001_departments.sql` | Day 1 |
| `shifts` + `user_shifts` | `20260812_002_shifts.sql` | Day 1 |
| `leave_requests` | `20260812_003_leave_requests.sql` | Day 1 |
| `policies` | `20260812_004_policies.sql` | Day 1 |
| `office_ip_ranges` | `20260812_005_ip_and_flags.sql` | Day 1 |
| Add `ip_address`, `login_type`, `late_flag`, `early_flag` to `work_sessions` | same file | Day 1 |
| Add `department_id` to `users` | `20260812_001_departments.sql` | Day 1 |

---

### `extension/` — Chrome Extension (MV3)

| File | Purpose | Status |
|------|---------|--------|
| `manifest.json` | Extension config, permissions: `history, tabs, alarms, storage, activeTab, scripting` | ✅ |
| `background.js` | Service worker: screenshot alarm (15 min) + history tracking (60s batch) | ✅ |
| `config.js` | Supabase URL + key for extension | ✅ |
| `popup.html` | Extension popup UI | ✅ |
| `popup.js` | Extension popup logic | ✅ |

**Known Issues with Extension:**
- `duration_seconds` is hardcoded to `0` — real tab-focus duration tracking not yet implemented
- Browser history POSTs directly to `/rest/v1/browser_history` (Supabase REST), not via Edge Function
- Screenshots upload works but need to verify end-to-end on production

---

## 📈 Feature Completion Tracker

### ✅ COMPLETED (as of Aug 12, 2026)

| # | Feature | Files |
|---|---------|-------|
| 1 | Login / JWT auth / RBAC | `auth.ts`, `supabase/functions/auth/` |
| 2 | Clock In / Out / Break In / Out | `EmployeeDashboardPage.tsx`, `work-sessions` edge function |
| 3 | Employee Workday Dashboard (live timer, session status) | `EmployeeDashboardPage.tsx` |
| 4 | Timesheet (session history + notes) | `TimesheetPage.tsx` |
| 5 | Attendance Calendar (monthly, PRESENT/ABSENT/LEAVE, correction requests) | `AttendancePage.tsx` + `attendance-api.ts` |
| 6 | Attendance Corrections (employee submit + manager approve/reject) | `AttendancePage.tsx`, 3 edge function endpoints |
| 7 | Browser History page (admin/manager, timeline, stats, filters) | `BrowserHistoryPage.tsx` |
| 8 | Screenshots page (admin/manager, date+user filter, modal) | `ScreenshotsPage.tsx` |
| 9 | Real-time Chat (groups, direct, messages) | `ChatsPage.tsx`, `supabase/functions/chat/` |
| 10 | WebRTC Voice/Video Calls | `useWebRTC.ts`, `CallScreen.tsx` |
| 11 | Kanban Tasks | `TasksPage.tsx`, `supabase/functions/tasks/` |
| 12 | Admin: User management | `AdminUsersPage.tsx` |
| 13 | Admin: Team management | `AdminTeamsPage.tsx` |
| 14 | Manager: Team overview (active-now, hours) | `Dashboard.tsx` (AdminDashboard component) |
| 15 | Chrome Extension (screenshots + history) | `extension/background.js` |

### 🟡 PARTIAL — Needs Work

| # | Feature | Gap | Day to Fix |
|---|---------|-----|-----------|
| 1 | Employee Dashboard (`/`) | Static placeholder card — not connected to live API | Day 4 |
| 2 | Admin Browser History page | No filters, raw table only | Day 5 (UI polish) |
| 3 | TeamPage | Basic styling, not at design system parity | Day 5 (UI polish) |
| 4 | Timesheet CSV export | No export button | Day 3 |
| 5 | Attendance CSV export | No export button | Day 3 |
| 6 | Extension: duration tracking | `duration_seconds` always 0 | Day 5 |

### ❌ NOT STARTED — Sprint TODO

| # | Feature | Day | Priority |
|---|---------|-----|---------|
| 1 | DB migrations (departments, shifts, leave, policies, ip columns) | Day 1 | 🔴 Blocker for everything |
| 2 | IP address capture on clock actions | Day 1 | 🔴 |
| 3 | WFH / Site classification | Day 1 | 🔴 |
| 4 | WFH/Site badge on Employee Dashboard | Day 1 | 🟠 |
| 5 | IP column on Manager team view | Day 1 | 🟠 |
| 6 | Late / early flag logic (based on assigned shift) | Day 1 | 🟠 |
| 7 | Leave Requests (employee submit, manager approve/reject) | Day 2 | 🔴 |
| 8 | Shift Scheduling (admin create, assign; employee view) | Day 2 | 🔴 |
| 9 | Department management (admin CRUD) | Day 3 | 🟠 |
| 10 | Reports page (filtered, all columns, CSV) | Day 3 | 🔴 |
| 11 | Analytics page (KPIs: hours, late count, WFH ratio, leave stats) | Day 3 | 🟠 |
| 12 | Employee Notes UI (form to add note to current session) | Day 4 | 🟡 |
| 13 | Manager Comments (annotate attendance records) | Day 4 | 🟡 |
| 14 | Policy Display (admin create/edit, employee read) | Day 4 | 🟠 |
| 15 | Audit Logs page (admin read-only view) | Day 4 | 🟡 |
| 16 | Trusted IP configuration panel (admin) | Day 4 | 🟡 |
| 17 | Dark mode toggle (persisted per user) | Day 5 | 🟡 |
| 18 | Email notifications (missed clock-out, leave alerts, daily summary) | Day 5 | 🟡 |
| 19 | Production build + deployment runbook | Day 5 | 🔴 |

---

## 🗺️ Current Routes

```
/login                    → LoginPage (public)
/                         → Dashboard (role-switching)
/employee                 → EmployeeDashboardPage
/timesheet                → TimesheetPage
/attendance               → AttendancePage ← fully rebuilt Aug 12
/chats                    → ChatsPage
/tasks                    → TasksPage
/team                     → TeamPage
/browser-history          → BrowserHistoryPage
/screenshots              → ScreenshotsPage
/admin                    → AdminPage
/admin/users              → AdminUsersPage
/admin/teams              → AdminTeamsPage
/admin/browser-history    → admin/BrowserHistoryPage

── TO ADD IN SPRINT ──────────────────────────────────────
/leave                    → LeaveRequestsPage       (Day 2)
/reports                  → ReportsPage              (Day 3)
/policies                 → PoliciesPage             (Day 4)
/admin/shifts             → ShiftSchedulingPage      (Day 2)
/admin/departments        → DepartmentsPage          (Day 3)
/admin/analytics          → AnalyticsPage            (Day 3)
/admin/audit-logs         → AuditLogsPage            (Day 4)
/admin/ip-config          → IpConfigPage             (Day 4)
```

---

## 🏗️ Design System Reference

All pages must follow these CSS class conventions (enforced via `src/index.css`):

| Element | Class |
|---------|-------|
| Page title | `page-heading` |
| Page subtitle | `page-subheading` |
| Section label / column header | `section-label` |
| Card container | `card-premium` |
| Stat icon container | `stat-icon` |
| Input field | `input-premium` |
| Font | `font-display` (headings), `font-mono` (numbers/timestamps) |

**Color tokens:**
- `text-primary` — brand accent
- `text-success` — green (present, approved)
- `text-destructive` — red (absent, rejected)
- `text-warning` — amber (pending, leave)
- `text-info` — blue (info states)
- `text-muted-foreground` — secondary text

**Always include on new pages:**
- Skeleton loading states for every data-dependent section
- Empty state with icon + descriptive message
- `animate-fade-in` on the outermost div
- Unique `id` attributes on all interactive elements

---

## 🔑 Key Architecture Patterns

### 1. API Module Pattern
Every API module follows the same structure:

```ts
const BASE = IS_PROD
  ? `/supabase-proxy.php?path=work-sessions`
  : `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/work-sessions`;

async function request(path, options?) {
  const res = await fetch(`${BASE}/${path}`, {
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    ...options
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}
```

- In **dev** → hits Supabase Edge Function directly
- In **production** → goes through `supabase-proxy.php` (PHP reverse proxy on the web server to solve CORS)

### 2. Edge Function Auth Pattern
Every protected endpoint starts with:
```ts
const claims = await requireAuth(req, jwtSecret);
if (!claims) return json({ error: "Unauthorized" }, 401);
const userId = claims.sub as string;
const userRole = claims.role as string;
```

### 3. Routing in Edge Functions
The `work-sessions` function uses `pathParts` for routing:
```ts
const pathParts = url.pathname.split("/").filter(Boolean);
const action = pathParts[pathParts.length - 1];
if (action === "attendance" && req.method === "GET") { ... }
if (action === "review" && pathParts.includes("corrections")) { ... }
```

### 4. Role Gating
```ts
if (userRole !== "MANAGER" && userRole !== "ADMIN") {
  return json({ error: "Forbidden" }, 403);
}
```

### 5. React Query Usage
```tsx
const { data, isLoading } = useQuery({
  queryKey: ["unique-key", param1, param2],
  queryFn: () => someApi.getData(param1, param2),
  enabled: !!user,        // don't run if not logged in
  refetchInterval: 15000, // auto-refresh every 15s if needed
});

const mutation = useMutation({
  mutationFn: someApi.doAction,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ["unique-key"] }),
});
```

---

## 🐛 Known Issues

| # | Issue | Status |
|---|-------|--------|
| 1 | Extension `duration_seconds` always 0 | Known — fix in Day 5 |
| 2 | Extension posts to Supabase REST directly (not Edge Function) | Known — Day 5 |
| 3 | Employee `/` dashboard card shows static data | Partial — fix in Day 4 |
| 4 | Admin Browser History page has no filters | Partial — fix in Day 5 polish |
| 5 | `supabase-proxy.php` not in repo — must be on production server | Block on deployment — get from Mantasha or server admin |

---

## 🚀 Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
# → http://localhost:8080

# The app calls Supabase Edge Functions directly in dev.
# Edge Functions are NOT run locally — they call the live Supabase project.
```

**To run/test edge functions locally** (optional):
```bash
supabase start          # starts local Supabase
supabase functions serve work-sessions --env-file .env.local
```

---

## 📦 Deployment

**Frontend:**
```bash
npm run build           # outputs to dist/
# Upload dist/ to web server
```

**Edge Functions:**
```bash
supabase functions deploy work-sessions
supabase functions deploy admin
supabase functions deploy auth
supabase functions deploy chat
supabase functions deploy tasks
supabase functions deploy notifications   # new in Day 5
```

**Database migrations:**
```bash
supabase db push        # applies pending migrations to production
# OR manually paste migration SQL into Supabase dashboard SQL editor
```

**Required on web server:**
- `supabase-proxy.php` — PHP reverse proxy to forward requests to Supabase Edge Functions (needed in production to solve CORS). Get from previous developer (Mantasha) or server admin.

---

## 📋 5-Day Sprint Summary

> Full plan: see `5_day_plan.md`

| Day | Theme | Key Outputs |
|-----|-------|------------|
| **Day 1** | DB Foundation + IP/WFH | 5 migrations, IP capture on clock actions, WFH/Site badge |
| **Day 2** | Leave Requests + Shifts | Full leave workflow, shift admin + employee view |
| **Day 3** | Departments + Reports + Analytics + CSV | Reports page, dept mgmt, analytics KPIs, CSV export |
| **Day 4** | Notes + Comments + Policies + Audit + IP Config | All remaining feature modules + live employee dashboard |
| **Day 5** | Dark Mode + Notifications + Polish + Deploy | Dark mode toggle, email alerts, UI audit, production |

---

## 📞 Contacts & Resources

| Resource | Detail |
|----------|--------|
| Supabase Project | `https://supabase.com/dashboard/project/fnojavvttewlritnqgiz` |
| Active anon key | In `.env` — `VITE_SUPABASE_PUBLISHABLE_KEY` |
| Previous developer | Mantasha (has `supabase-proxy.php` + old project credentials) |
| Requirements doc | `updated req.md` in repo root |
| Sprint plan | `5_day_plan.md` in repo root |
