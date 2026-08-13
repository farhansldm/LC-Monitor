# LC Monitor — 5-Day Completion Sprint

> **Start:** August 12, 2026
> **Goal:** Ship every feature in `updated req.md` — nothing left behind.
> **Already Done:** Auth, Clock In/Out, Breaks, Attendance Calendar, Browser History, Screenshots, Tasks, Chat, Admin Users/Teams, Team Overview.

---

## 📊 What's Already Built (Don't Redo)

| Module | Status |
|--------|--------|
| Login / JWT auth / RBAC | ✅ |
| Clock In / Out / Break In / Out | ✅ |
| Employee Workday Dashboard | ✅ |
| Attendance Calendar + Corrections | ✅ |
| Browser History page | ✅ |
| Screenshots page | ✅ |
| Tasks + Chat | ✅ |
| Admin: Users + Teams management | ✅ |
| Manager: Team Overview | ✅ |

---

## 📅 Day 1 — Database Foundation + IP/WFH Classification

**Goal:** All missing DB tables + capture IP on every time action + display WFH/Site on dashboards.

### 1A — Database Migrations (do first, everything depends on this)

**[NEW]** `supabase/migrations/20260812_001_departments.sql`
```sql
CREATE TABLE public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES public.departments(id);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS monitor_token text;
```

**[NEW]** `supabase/migrations/20260812_002_shifts.sql`
```sql
CREATE TABLE public.shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  start_time time NOT NULL,       -- e.g. 09:00
  end_time time NOT NULL,         -- e.g. 18:00
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.user_shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id),
  shift_id uuid NOT NULL REFERENCES public.shifts(id),
  effective_from date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);
```

**[NEW]** `supabase/migrations/20260812_003_leave_requests.sql`
```sql
CREATE TABLE public.leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id),
  date date NOT NULL,
  reason text NOT NULL,
  status public.correction_status NOT NULL DEFAULT 'PENDING',
  reviewer_id uuid REFERENCES public.users(id),
  reviewer_comment text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

**[NEW]** `supabase/migrations/20260812_004_policies.sql`
```sql
CREATE TABLE public.policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  created_by uuid REFERENCES public.users(id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
```

**[NEW]** `supabase/migrations/20260812_005_ip_and_flags.sql`
```sql
-- Add IP + WFH/Site + late/early flags to work_sessions
ALTER TABLE public.work_sessions
  ADD COLUMN IF NOT EXISTS ip_address text,
  ADD COLUMN IF NOT EXISTS login_type text CHECK (login_type IN ('WFH', 'SITE')),
  ADD COLUMN IF NOT EXISTS late_flag boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS early_flag boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notes text;

-- Trusted office IP ranges (admin-configurable)
CREATE TABLE public.office_ip_ranges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cidr text NOT NULL,             -- e.g. "192.168.1.0/24"
  label text,
  created_at timestamptz NOT NULL DEFAULT now()
);
DISABLE ROW LEVEL SECURITY on all new tables...
```

### 1B — IP Capture in Edge Function

**MODIFY** `supabase/functions/work-sessions/index.ts`
- On `clock-in`: read `X-Forwarded-For` / `CF-Connecting-IP` header → store as `ip_address`
- Fetch `office_ip_ranges` from DB → classify as `WFH` or `SITE` → store as `login_type`
- If `user_shifts` exists for user: fetch shift → compare `start_time` to clock-in time → set `late_flag`
- Same IP capture on `clock-out` (for `early_flag` vs shift end_time)

### 1C — Display WFH/Site on Employee Dashboard

**MODIFY** `src/pages/EmployeeDashboardPage.tsx`
- Read `login_type` and `ip_address` from the `getStatus()` response
- Show pill badge: `🏠 Working from Home` or `🏢 Working from Office`

### 1D — Display IP on Manager Team View

**MODIFY** `src/pages/Dashboard.tsx` (AdminDashboard / manager view)
- Add IP address + WFH/Site badge column to the active-now team table

### Files to Create / Modify
- **[NEW]** 5 migration `.sql` files
- `supabase/functions/work-sessions/index.ts` — IP capture + classification + late flag
- `src/pages/EmployeeDashboardPage.tsx` — WFH/Site badge
- `src/pages/Dashboard.tsx` — IP column on team table

### Deliverable
> IP captured on every clock action. Employee sees "Working from Home / Office". Manager sees IP per employee.

---

## 📅 Day 2 — Leave Requests + Shift Scheduling

**Goal:** Build the Leave Requests module end-to-end + Shift Scheduling for admin + view for employee.

### 2A — Leave Requests (Full)

**[NEW]** `src/lib/leave-api.ts`
- `getMyLeaves()` — employee's own requests
- `submitLeave(date, reason)` — POST
- `getTeamLeaves()` — MANAGER/ADMIN: all requests with employee names
- `reviewLeave(id, action, comment)` — MANAGER/ADMIN: approve/reject with optional comment

**[NEW]** `supabase/functions/work-sessions/index.ts` — add leave endpoints:
- `GET /leave/mine` — employee's own leave requests
- `POST /leave` — submit new leave
- `GET /leave/all` — manager: all requests (with user join)
- `PATCH /leave/:id/review` — approve/reject; on APPROVE → insert `attendance` row with `LEAVE` status

**[NEW]** `src/pages/LeaveRequestsPage.tsx`
- Employee view: date picker + reason form + status history table
- Manager section (role-gated): table of all pending leaves with Approve / Reject + optional comment

**MODIFY** `src/App.tsx` — add `/leave` route
**MODIFY** `src/components/AppSidebar.tsx` — add "Leave Requests" nav item (all roles)

### 2B — Shift Scheduling

**[NEW]** `src/lib/shifts-api.ts`
- `getMyShift()` — employee: own assigned shift
- `getAllShifts()` — admin: list all shift definitions
- `createShift(name, start_time, end_time)` — admin: create shift
- `assignShift(user_id, shift_id)` — admin: assign to employee

**[NEW]** `supabase/functions/work-sessions/index.ts` — add shift endpoints:
- `GET /shifts/mine` — employee's assigned shift
- `GET /shifts` — admin: all shifts
- `POST /shifts` — admin: create shift
- `POST /shifts/assign` — admin: assign shift to user

**[NEW]** `src/pages/admin/ShiftSchedulingPage.tsx`
- Table of all shifts with Create/Edit actions
- Assign shift to employee dropdown
- Shows who is assigned which shift

**MODIFY** `src/pages/EmployeeDashboardPage.tsx`
- Show assigned shift start/end time on the workday card

**MODIFY** `src/App.tsx` + `src/components/AppSidebar.tsx` — add `/admin/shifts` route

### Files to Create / Modify
- **[NEW]** `src/lib/leave-api.ts`
- **[NEW]** `src/lib/shifts-api.ts`
- **[NEW]** `src/pages/LeaveRequestsPage.tsx`
- **[NEW]** `src/pages/admin/ShiftSchedulingPage.tsx`
- `supabase/functions/work-sessions/index.ts` — leave + shift endpoints
- `src/App.tsx`, `src/components/AppSidebar.tsx`

### Deliverable
> Employees submit leave. Managers approve/reject. Admin creates shifts and assigns to employees. Employee sees shift times on their dashboard.

---

## 📅 Day 3 — Departments + Reports + CSV Export + Analytics

**Goal:** Department management, a full Reports page with CSV export, and a Basic Analytics page.

### 3A — Department Management (Admin)

**[NEW]** `src/pages/admin/DepartmentsPage.tsx`
- List all departments (create / rename / delete)
- Assign users to department (inline in AdminUsersPage)

**MODIFY** `supabase/functions/admin/index.ts` — add department CRUD endpoints
**MODIFY** `src/pages/admin/AdminUsersPage.tsx` — add department dropdown on each user row
**MODIFY** `src/App.tsx` + `src/components/AppSidebar.tsx` — add `/admin/departments`

### 3B — Reports Page (Manager + Admin)

**[NEW]** `src/pages/ReportsPage.tsx`
- Filters: date range + employee + department + status
- Table columns: Employee, Date, Clock In, Clock Out, Total Hours, Break Duration, Late, Early, IP, WFH/Site, Notes, Manager Comment
- "Export CSV" button

**[NEW]** `supabase/functions/work-sessions/index.ts` — `GET /reports` endpoint
- Accepts `from`, `to`, `user_id`, `department_id` query params
- Joins `work_sessions` + `users` + `departments` + `breaks`
- MANAGER: restricted to own team; ADMIN: all

**[NEW]** `src/lib/reports-api.ts`
- `getReport(params)` — fetch report data
- `exportToCsv(data, filename)` — client-side CSV generation helper

**MODIFY** `src/App.tsx` + `src/components/AppSidebar.tsx` — add `/reports` (MANAGER + ADMIN)

### 3C — CSV Export on Existing Pages

**MODIFY** `src/pages/TimesheetPage.tsx` — add "Export CSV" button (client-side)
**MODIFY** `src/pages/AttendancePage.tsx` — add "Export CSV" button

### 3D — Analytics Page (Admin)

**[NEW]** `src/pages/admin/AnalyticsPage.tsx`
- Stat cards: Total hours this month, Avg working hours/day, Avg break duration, Late arrivals count, Early departures count, WFH vs Site ratio, Leave taken this month
- Simple bar/line chart using `recharts` (already in most Vite+React stacks; add if needed)

**[NEW]** `supabase/functions/work-sessions/index.ts` — `GET /analytics` endpoint
- Aggregate queries: SUM(total_active_seconds), COUNT(late_flag), COUNT per login_type, etc.

**MODIFY** `src/App.tsx` + `src/components/AppSidebar.tsx` — add `/admin/analytics`

### Files to Create / Modify
- **[NEW]** `src/pages/admin/DepartmentsPage.tsx`
- **[NEW]** `src/pages/ReportsPage.tsx`
- **[NEW]** `src/lib/reports-api.ts`
- **[NEW]** `src/pages/admin/AnalyticsPage.tsx`
- `supabase/functions/work-sessions/index.ts` — reports + analytics endpoints
- `supabase/functions/admin/index.ts` — department CRUD
- `src/pages/TimesheetPage.tsx`, `src/pages/AttendancePage.tsx` — CSV buttons
- `src/App.tsx`, `src/components/AppSidebar.tsx`

### Deliverable
> Admin manages departments. Reports page with full filters + CSV export. Analytics page with key KPIs. Timesheet and attendance have export buttons.

---

## 📅 Day 4 — Employee Notes + Manager Comments + Policy Display + Audit Logs + Employee Dashboard Polish

**Goal:** All remaining feature modules + polishing the employee-facing dashboard.

### 4A — Employee Notes

**MODIFY** `src/pages/EmployeeDashboardPage.tsx`
- Add a "Add Note" text input on the current session card
- Calls existing `workSessionsApi.updateNotes(session_id, notes)` (already built)
- Display saved note on the card

### 4B — Manager Comments

**MODIFY** `src/pages/ReportsPage.tsx` (or a new attendance detail modal)
- Manager can click any attendance row → open side sheet
- Text field to add/edit manager comment
- `PATCH /work-sessions/:session_id/manager-comment` endpoint

**MODIFY** `supabase/functions/work-sessions/index.ts` — add `PATCH /manager-comment` endpoint
- Validates `MANAGER`/`ADMIN` role
- Updates `notes` (or new `manager_comment` if column added) on `work_sessions`

### 4C — Policy Display

**[NEW]** `src/lib/policies-api.ts`
- `getPolicies()` — all employees
- `createPolicy(title, content)` — ADMIN only
- `updatePolicy(id, title, content)` — ADMIN only
- `deletePolicy(id)` — ADMIN only

**[NEW]** `supabase/functions/admin/index.ts` — policy CRUD endpoints

**[NEW]** `src/pages/PoliciesPage.tsx`
- Employee view: list of policies, click to expand/read
- Admin extras: Create / Edit / Delete buttons visible to ADMIN role only

**MODIFY** `src/App.tsx` + `src/components/AppSidebar.tsx` — add `/policies` (all roles)

### 4D — Audit Logs Page (Admin)

**[NEW]** `src/pages/admin/AuditLogsPage.tsx`
- Read-only table: Action, User, Metadata (IP, session_id), Timestamp
- Date range filter + user filter
- Paginated (load more / 50 per page)

**MODIFY** `supabase/functions/admin/index.ts` — add `GET /audit-logs` endpoint with filters

### 4E — Admin: Trusted IP Configuration

**[NEW]** `src/pages/admin/IpConfigPage.tsx`
- List all trusted CIDR ranges (e.g. `192.168.1.0/24 — Head Office`)
- Add / Remove ranges
- Simple validation that input is valid CIDR

**MODIFY** `supabase/functions/admin/index.ts` — CRUD for `office_ip_ranges` table

### 4F — Employee Dashboard Polish (Day 5 requirement from old plan)

**MODIFY** `src/pages/Dashboard.tsx` — `EmployeeDashboard` component:
- Live clock-in status from `workSessionsApi.getStatus()`
- Today's actual hours (real-time ticking)
- This week's total hours
- Quick Clock In / Clock Out button
- WFH/Site badge
- Link to full workday page

### Files to Create / Modify
- **[NEW]** `src/lib/policies-api.ts`
- **[NEW]** `src/pages/PoliciesPage.tsx`
- **[NEW]** `src/pages/admin/AuditLogsPage.tsx`
- **[NEW]** `src/pages/admin/IpConfigPage.tsx`
- `supabase/functions/admin/index.ts` — policies + audit logs + IP config
- `supabase/functions/work-sessions/index.ts` — manager-comment endpoint
- `src/pages/EmployeeDashboardPage.tsx` — notes input
- `src/pages/ReportsPage.tsx` — manager comment side sheet
- `src/pages/Dashboard.tsx` — live employee dashboard
- `src/App.tsx`, `src/components/AppSidebar.tsx`

### Deliverable
> Employees add session notes. Managers annotate records. Admin manages policies (employees can read). Audit log is visible. Trusted IPs configurable. Employee main dashboard shows live data.

---

## 📅 Day 5 — UI Polish + Dark Mode + Notifications + Deployment

**Goal:** Dark mode toggle, email notifications, full UI consistency audit, production build.

### 5A — Dark Mode

**MODIFY** `src/index.css` — ensure CSS variables support both `:root` (dark) and `.light` class
**[NEW]** `src/contexts/ThemeContext.tsx`
- `useTheme()` hook: `theme` state (`dark` | `light`) + `toggleTheme()`
- Persists to `localStorage`

**MODIFY** `src/components/AppSidebar.tsx` — add theme toggle button in footer
**MODIFY** `src/main.tsx` — wrap with `ThemeProvider`

### 5B — Email Notifications

**[NEW]** `supabase/functions/notifications/index.ts` — scheduled/triggered Deno function
- Use **Resend** (or Supabase built-in SMTP) to send emails
- Triggers:
  - **Missed clock-out**: run at 8pm → find sessions with no `end_time` → email employee
  - **Leave approval/rejection**: called after `reviewLeave()` mutation
  - **Daily summary**: run at 7am → email each employee yesterday's hours

**MODIFY** `supabase/functions/work-sessions/index.ts` — call notification trigger after leave review

> **Note:** Requires `RESEND_API_KEY` env var in Supabase secrets. If not available on Day 5, stub with a `console.log` and mark as ready-to-activate.

### 5C — UI Consistency Audit

**MODIFY** `src/pages/admin/BrowserHistoryPage.tsx` — upgrade to match main BrowserHistoryPage style
**MODIFY** `src/pages/TeamPage.tsx` — bring to design-system parity (card-premium, section-label)
**AUDIT** all new pages built in Days 1–4 for:
- `page-heading` / `page-subheading` classes on every header
- `card-premium` on every card
- Skeleton loading states on every data-dependent section
- Empty states with icon + message
- Mobile: tables scroll, sidebar collapses

### 5D — Chrome Extension (do not start before Day 5)

Core monitoring already works: popup login, 15‑min screenshots, 60s history batch, Edge Function uploads. **Leave this until Day 5.**

**MODIFY** `extension/background.js`
- Track real tab-focus time so `duration_seconds` is not always `0`
- Replace history `setInterval` with `chrome.alarms` (MV3 service workers sleep)
- Handle `ACTIVATE_MONITORING` from the web dashboard (today only popup `LOGIN_SUCCESS` works)

**MODIFY** `src/lib/extension-activate.ts`
- Use the current unpacked / published extension ID (hardcoded ID is likely stale)

**VERIFY**
- [ ] Reload unpacked `extension/` in Chrome
- [ ] Login via popup → screenshot appears on `/screenshots` after a cycle
- [ ] Visit a few sites → rows appear on `/browser-history` with non-zero duration
- [ ] Web login activates monitoring without a second popup login
- [ ] `Authorization: Bearer` is sent on screenshot + history POSTs

### 5E — Production Build + Deployment

```bash
# 1. Build
npm run build

# 2. Test locally
npx serve dist

# 3. Deploy edge functions
supabase functions deploy work-sessions
supabase functions deploy admin
supabase functions deploy auth
supabase functions deploy notifications

# 4. Run all pending migrations on production Supabase
supabase db push  (or paste migrations in Supabase dashboard SQL editor)

# 5. Upload dist/ to hosting server
```

**[NEW]** `DEPLOYMENT.md` — runbook for future redeployment

### Files to Create / Modify
- **[NEW]** `src/contexts/ThemeContext.tsx`
- **[NEW]** `supabase/functions/notifications/index.ts`
- **[NEW]** `DEPLOYMENT.md`
- `src/index.css` — light mode CSS variables
- `src/components/AppSidebar.tsx` — theme toggle
- `src/main.tsx` — ThemeProvider
- Various UI polish across all pages
- `extension/background.js`, `src/lib/extension-activate.ts` — duration + web-login activate
- Production build + deploy

### Deliverable
> Dark mode works. Email alerts configured. All pages consistent. Extension duration + web-login activation verified. Production build deployed and live.

---

## 📊 5-Day Summary

| Day | Focus | Key Deliverables | Est. Effort |
|-----|-------|-----------------|-------------|
| **Day 1** | DB Foundation + IP/WFH | 5 migrations, IP capture, WFH/Site badges | 6–8 hrs |
| **Day 2** | Leave Requests + Shifts | Full leave flow, shift admin, shift on dashboard | 6–8 hrs |
| **Day 3** | Departments + Reports + Analytics + CSV | Reports page, dept mgmt, analytics, CSV exports | 7–9 hrs |
| **Day 4** | Notes + Comments + Policies + Audit + IP Config | All remaining feature modules, live dashboard | 7–9 hrs |
| **Day 5** | Dark Mode + Notifications + Polish + Extension + Deploy | Dark mode, email alerts, UI audit, extension duration/activate, production | 5–7 hrs |
| **Total** | | **All requirements shipped** | **31–41 hrs** |

---

## ⚠️ Risks & Critical Dependencies

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Email provider (Resend) account needed | 🟡 Delays notifications | Create Resend account Day 1, get API key |
| `supabase db push` needs prod DB access | 🔴 Blocks deploy | Get Supabase project credentials Day 1 |
| `recharts` not installed | 🟡 Blocks analytics charts | `npm install recharts` at start of Day 3 |
| IP `X-Forwarded-For` may not work on local dev | 🟡 WFH/Site shows incorrectly in dev | Mock IP in dev mode; test on deployed version |
| Extension auth vs new IP logic | 🟡 Extension may not send correct headers | Verify `Authorization` on screenshot + history POSTs (Day 5) |
| Extension `duration_seconds` always 0 | 🟡 History time-on-site is blank | Tab-focus tracking on Day 5 |
| Web login does not start extension | 🟡 Employees must log in twice | Wire `ACTIVATE_MONITORING` + current extension ID on Day 5 |

---

## 🏁 What "Done" Looks Like

At the end of Day 5, every item in `updated req.md` is implemented:

- ✅ Auth (email, JWT, RBAC)
- ✅ Clock In/Out/Break with IP capture + WFH/Site classification
- ✅ Late/early flag based on assigned shift
- ✅ Attendance calendar + corrections
- ✅ Leave requests (employee submit, manager approve/reject)
- ✅ Shift scheduling (admin create, employee view)
- ✅ Department management + filtering
- ✅ Reports page (filtered, with CSV export)
- ✅ Analytics dashboard (KPIs)
- ✅ Employee notes on sessions
- ✅ Manager comments on attendance records
- ✅ Policy management (admin) + viewing (employee)
- ✅ Audit log page (read-only)
- ✅ Trusted IP configuration panel
- ✅ Dark mode toggle (persisted)
- ✅ Email notifications (missed clock-out, leave alerts, daily summary)
- ✅ CSV export on reports, timesheet, attendance
- ✅ Mobile-responsive, consistent UI
- ✅ Chrome extension: screenshots, history duration, web-login activation
- ✅ Production deployment with runbook
