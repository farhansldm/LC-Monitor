# LC Monitor — Complete Project Analysis & Feature Implementation Plan

## 1. What Is LC Monitor?

**LC Monitor** is a **workforce monitoring and management web application** built for a company called **LemonCode (LC)**. It is a full-stack SaaS-style internal tool that tracks employee work hours, attendance, tasks, browser activity, and internal communication in real-time.

The system is composed of **3 separate, interconnected parts**:

```
┌─────────────────────────────────┐    ┌──────────────────────┐    ┌──────────────────────┐
│  Web Dashboard (this repo)      │◄──►│  Supabase Backend    │◄──►│  Chrome Extension    │
│  React + TypeScript + Vite      │    │  PostgreSQL + Edge   │    │  ID: knficjgnn...    │
│  Tailwind CSS + ShadCN UI       │    │  Functions           │    │  Collects data from  │
│  Hosted/deployed separately     │    │  Auth, APIs, DB      │    │  employee machines   │
└─────────────────────────────────┘    └──────────────────────┘    └──────────────────────┘
```

---

## 2. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| UI Components | ShadCN UI (Radix UI primitives) + Tailwind CSS |
| State Management | TanStack React Query v5 |
| Routing | React Router DOM v6 |
| Real-time (Chats/Calls) | Supabase Realtime (WebSockets) |
| Voice/Video Calls | WebRTC (peer-to-peer, via Supabase broadcast as signaling) |
| Backend | Supabase Edge Functions (Deno/TypeScript) |
| Database | PostgreSQL (via Supabase) |
| Authentication | Custom JWT (Supabase Edge Functions + localStorage) |
| Data Collector | Chrome Extension (ID: `knficjgnnobghcolkkhdljidamomnhec`) |

---

## 3. Roles & Permission System

The app supports **3 user roles**:

| Role | What They Can See/Do |
|---|---|
| `EMPLOYEE` | Own workday, timesheet, sessions, breaks, tasks assigned to them, chats |
| `MANAGER` | Everything an employee can + Team overview, Browser History of team members |
| `ADMIN` | Everything + Admin panel (create/edit users & teams), Browser History of all employees |

---

## 4. Module-by-Module Breakdown

### 4.1 Authentication (`/login`)
- **File:** `src/pages/LoginPage.tsx`, `src/lib/auth.ts`, `src/contexts/AuthContext.tsx`
- Custom JWT-based authentication (NOT Supabase Auth)
- On login, calls Supabase Edge Function `/auth/login`, gets a JWT + user object
- Token stored in `localStorage` (`auth_token` + `sb-{projectId}-auth-token` for Supabase Realtime)
- After login, it silently activates the **Chrome Extension** (`activateMonitorExtension`) by sending the employee's `userId` and `monitorToken` via `chrome.runtime.sendMessage`

### 4.2 Dashboard (`/`)
- **File:** `src/pages/Dashboard.tsx`
- **Role-aware:** Shows 3 completely different dashboards depending on role:
  - **EMPLOYEE:** Basic placeholder (clock-in status, hours today, week)
  - **MANAGER:** Team overview table, who's working now, avg hours, session counts
  - **ADMIN:** Organization-wide stats (total users, working now, teams, pending reviews), live "Who's Working Now" list

### 4.3 My Workday (`/employee`)
- **File:** `src/pages/EmployeeDashboardPage.tsx`
- Live timer for work sessions (updates every second)
- Clock In, Start/End Break, Clock Out actions
- Displays today's sessions and break history
- Uses `work-sessions-api.ts` → Supabase Edge Functions

### 4.4 My Timesheet (`/timesheet`)
- **File:** `src/pages/TimesheetPage.tsx`
- Shows current day's session + last 14 days of history
- Allows employees to add notes to sessions
- Clock In/Out from this page too

### 4.5 Attendance (`/attendance`)
- **File:** `src/pages/AttendancePage.tsx`
- Minimal placeholder page (likely pending further implementation)

### 4.6 Tasks (`/tasks`)
- **File:** `src/pages/TasksPage.tsx`, `src/lib/tasks-api.ts`
- **Kanban board** with 3 columns: To Do, In Progress, Done
- Priority levels: Low, Medium, High, Urgent
- Admins/Managers can create + assign tasks; Employees can update their own
- Full **task activity history** (who changed what, when)
- Connects to Supabase Edge Functions at `/tasks`

### 4.7 Chats (`/chats`)
- **File:** `src/pages/ChatsPage.tsx`, `src/lib/chat-api.ts`, `src/components/chat/`
- Group chats (General, Team, Project types) + 1-on-1 Direct Messages
- **Real-time messages** via Supabase Realtime (Postgres changes subscription)
- **Voice & Video calls** via WebRTC (`src/hooks/useWebRTC.ts`) using Supabase broadcast as signaling server
- Features: member management, message search, date separators in chat view
- Screen sharing in video calls

### 4.8 Browser History (`/browser-history`)
- **File:** `src/pages/BrowserHistoryPage.tsx`
- **Admin/Manager only** — shows visited websites per employee per day
- Filters: select employee + select date + search by URL/title/domain
- Stats: Active Browsing Time, Unique Domains, Most Visited Site
- Top 5 Domains breakdown with visual progress bars
- Activity Timeline (chronological list with favicon, URL, duration)
- Data is pushed by the **Chrome Extension** → stored in `browser_history` table
- Refreshes every 15 seconds to catch live extension updates

### 4.9 Team (`/team`)
- **File:** `src/pages/TeamPage.tsx`
- Manager/Admin view of their team members (basic)

### 4.10 Admin Panel (`/admin`, `/admin/users`, `/admin/teams`)
- **Files:** `src/pages/AdminPage.tsx`, `src/pages/admin/AdminUsersPage.tsx`, `src/pages/admin/AdminTeamsPage.tsx`
- **User Management:** Create, edit, deactivate users; assign roles and teams; set job titles
- **Team Management:** Create teams, assign managers, add/remove members
- User creation shows credentials after creation with a "Copy" button

---

## 5. Database Schema (PostgreSQL via Supabase)

| Table | Purpose |
|---|---|
| `users` | Employee accounts (custom, NOT Supabase Auth users) |
| `teams` | Work teams with manager reference |
| `devices` | Registered employee machines (via extension) |
| `events` | Raw events (LOGIN, LOGOUT, ACTIVITY, IDLE, etc.) |
| `work_sessions` | Daily work session records (clock in/out) |
| `attendance` | Daily attendance status (PRESENT/ABSENT/LEAVE) |
| `attendance_corrections` | Employee-requested time corrections |
| `chat_groups` | Chat group definitions |
| `chat_group_members` | Members of each chat group |
| `chat_messages` | Chat messages with soft-delete |
| `browser_history` | URLs visited by employees (from Chrome extension) |
| `tasks` | Task assignments |
| `task_activity` | Audit trail for task changes |
| `work_session_breaks` | Break records within sessions |

> **Note:** RLS (Row Level Security) is disabled on most tables — access control is enforced by Edge Functions using JWT verification.

---

## 6. Supabase Edge Functions

| Function | Endpoints |
|---|---|
| `auth` | `/login`, `/signup`, `/me` |
| `work-sessions` | `/status`, `/clock-in`, `/clock-out`, `/break-in`, `/break-out`, `/active-now`, `/team-overview`, `/history`, `/notes`, `/browser-history` (GET + POST) |
| `admin` | `/stats`, `/users`, `/users/:id`, `/teams`, `/teams/:id/members` |
| `chat` | `/groups`, `/groups/:id/members`, `/groups/:id/messages`, `/search`, `/direct` |
| `tasks` | `/tasks`, `/activity` |

---

## 7. Production Deployment Setup

The app uses a **PHP proxy** (`supabase-proxy.php`) in production to route all API calls through the same domain — this bypasses CORS restrictions from Supabase Edge Functions. In development, calls go directly to Supabase Edge Functions. This is controlled by `import.meta.env.PROD`.

---

## 8. Chrome Extension Role

The **Chrome Extension** (ID: `knficjgnnobghcolkkhdljidamomnhec`) is the **data collection engine**. It is responsible for:
- Tracking active work sessions / detecting idle time
- Monitoring browser tab activity and URLs visited
- Pushing browser history data to Supabase (`browser_history` table)
- Receiving activation commands from the web dashboard after login (via `chrome.runtime.sendMessage`)

> [!IMPORTANT]
> The extension is a **completely separate codebase** not included in this repository. Without the extension, no employee data can be collected. The extension is published on the Chrome Web Store.

---

## 9. Current Environment / Incomplete Setup

> [!WARNING]
> The `.env` file shows the Supabase `ANON KEY` is NOT filled in:
> ```
> VITE_SUPABASE_PUBLISHABLE_KEY="[YOUR_NEW_ANON_KEY]"
> ```
> The project has been **migrated from an old Supabase project** (`aemljalkqrcucaxqpnpv`) to a **new one** (`cuawkttwzfpjtqwjaybu`), but the new anon key has not been provided yet. The app **will not work** until this is done.

---

## 10. Features Required by the Previous Developer (from Implementation Report)

The `implementation_report.html` and `Feature_Implementation_Requirements.pdf` both describe two pending features:

### Feature 1: 15-Minute Screenshot Intervals
- The Chrome Extension needs to be modified to trigger a screenshot **every 15 minutes** (changing its current timer logic in `background.js`)
- Screenshots are stored in Supabase Storage (table already exists)

### Feature 2: Browser History Tracking ✅ (PARTIALLY DONE)
- **Backend:** `browser_history` table migration has been written and applied (`20260529180000_create_browser_history_table.sql`)
- **Frontend:** `BrowserHistoryPage.tsx` is fully built
- **API:** `workSessionsApi.getBrowserHistory()` and `workSessionsApi.addBrowserHistory()` are implemented
- ❌ **Missing:** The Chrome Extension still needs to be updated to actually **collect and push** browsing data to the backend

---

## 11. Credentials Needed from Previous Developer (Mantasha)

> [!CAUTION]
> You MUST request ALL of the following from the previous developer before any further implementation can proceed:

| # | Credential / Asset | Why It's Needed |
|---|---|---|
| **1** | **Chrome Extension Source Code** (the folder with `manifest.json`, `background.js`, `content.js`) | The extension is the only way to collect screenshots and browser history from employee machines. We need to modify `background.js` to add 15-minute screenshot timing and URL history collection. |
| **2** | **Supabase Dashboard Access** (for project `cuawkttwzfpjtqwjaybu`) | To get the **anon/public API key** so the app can connect to the database at all. Also needed to deploy Edge Functions and run migrations. |
| **3** | **Supabase `service_role` key** | Needed to run database migrations manually if the CLI is not used, and for Edge Function secrets setup. |
| **4** | **Chrome Web Store Developer Account Access** | To publish the updated Chrome Extension so all employees receive the update automatically. If employees installed it via developer mode manually, instead you'll need to distribute the updated extension folder to them. |
| **5** | **The `monitor_token` generation logic** | The auth system returns a `monitor_token` per user — this token is passed to the Chrome Extension on login. We need to understand how this token is generated/verified in the Extension so the new features work securely. |
| **6** | **Production server/hosting details** | To know where the `supabase-proxy.php` is hosted and how to deploy the updated build. |

---

## 12. Implementation Plan for Pending Features

### Phase 0: Unblock Setup (Day 1)
- [ ] Get Supabase anon key for project `cuawkttwzfpjtqwjaybu` → update `.env`
- [ ] Get Chrome Extension source code from Mantasha
- [ ] Verify the app runs locally (`npm install` + `npm run dev`)

---

### Phase 1: Chrome Extension — 15-Minute Screenshots
**Who does it:** Developer with extension source code

- [ ] Open `background.js` in the extension
- [ ] Find existing screenshot logic (likely `chrome.alarms` or `setInterval`)
- [ ] Change trigger interval to exactly **15 minutes** (900000ms)
- [ ] Ensure screenshots are uploaded to Supabase Storage under the user's folder
- [ ] Test: Clock in → wait 15 mins → verify screenshot appears in dashboard

---

### Phase 2: Chrome Extension — Browser History Collection
**Who does it:** Developer with extension source code

- [ ] Add `"history"` and `"tabs"` to `manifest.json` permissions
- [ ] In `background.js`, add a `chrome.tabs.onActivated` + `chrome.tabs.onUpdated` listener
- [ ] Track: `url`, `title`, `domain`, `visited_at`, `duration_seconds` (time tab was active)
- [ ] Batch the collected URLs every 2-3 minutes and POST to:
  ```
  POST /work-sessions/browser-history
  Authorization: Bearer <monitorToken>
  Body: [{ url, title, domain, duration_seconds, visited_at, session_id }]
  ```
- [ ] The API endpoint already exists in `workSessionsApi.addBrowserHistory()`

---

### Phase 3: Screenshots Page — Web Dashboard
**Who does it:** Us (frontend developer)

> [!NOTE]
> The browser history page is already built. For screenshots, a new page needs to be created.

- [ ] Create `src/pages/ScreenshotsPage.tsx`
  - Filters: employee selector + date picker
  - Grid view of screenshot thumbnails (from Supabase Storage)
  - Click to view full-size
  - Admin/Manager only access
- [ ] Add route `/screenshots` to `App.tsx`
- [ ] Add "Screenshots" nav item to `AppSidebar.tsx` (MANAGER + ADMIN roles)
- [ ] Add `workSessionsApi.getScreenshots(userId, date)` API method
- [ ] Add screenshots Edge Function endpoint if not yet built

---

### Phase 4: Attendance Page — Full Implementation
**Who does it:** Us (frontend developer)

The current `AttendancePage.tsx` is a placeholder. Based on the database schema it should show:
- [ ] Calendar view with daily attendance status (PRESENT / ABSENT / LEAVE / HOLIDAY)
- [ ] Overtime / undertime calculation
- [ ] Attendance correction request form (references `attendance_corrections` table)
- [ ] Manager view: approve/reject correction requests

---

### Phase 5: Employee Dashboard Enhancement
**Who does it:** Us (frontend developer)

The Employee role dashboard (`/`) shows a static placeholder. It should be:
- [ ] Connected to `workSessionsApi.getStatus()` for live time tracking
- [ ] Unified with `EmployeeDashboardPage` (currently there are two separate dashboard concepts)

---

### Phase 6: Deployment Pipeline
- [ ] Run `npm run build` to create production bundle
- [ ] Upload built files to the production web server
- [ ] Ensure `supabase-proxy.php` is on the server
- [ ] Upload the new Chrome Extension to Chrome Web Store (or distribute manually)

---

## 13. Summary Architecture Diagram

```
[Employee's Browser]
      │
      ├── Chrome Extension (background.js)
      │   ├── Screenshots every 15 min → Supabase Storage
      │   └── Browser URLs every 2-3 min → browser_history table
      │
      └── LC Monitor Web App
          ├── /employee → Clock In/Out, Breaks
          ├── /timesheet → Session history
          ├── /tasks → Kanban board
          ├── /chats → Real-time messaging + WebRTC calls
          └── /browser-history → URL activity (Admin/Manager only)

[Manager's Browser]
      └── LC Monitor Web App
          ├── / → Team overview dashboard
          ├── /browser-history → See employee URL activity
          └── /team → Team member list

[Admin's Browser]
      └── LC Monitor Web App
          ├── / → Org-wide dashboard
          ├── /admin/users → Create/edit/deactivate users
          ├── /admin/teams → Create teams, assign managers
          └── /browser-history → See ALL employees' URL activity
```
