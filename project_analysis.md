# LC Monitor — Full Project Analysis & Progress Report

## 🏗️ What Is This Project?

**LC Monitor** is an internal **workforce monitoring & management web application** for LemonCode (LC). It is a full-stack SaaS-style tool that tracks employee work hours, attendance, tasks, browser activity, and enables internal communication.

The system has **3 interconnected parts:**

```
Web Dashboard (React/Vite)  ◄──►  Supabase Backend  ◄──►  Chrome Extension
(this repo)                        (PostgreSQL + Edge        (data collector)
                                    Functions)
```

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| UI | ShadCN UI (Radix UI) + Tailwind CSS |
| State | TanStack React Query v5 |
| Routing | React Router DOM v6 |
| Real-time | Supabase Realtime (WebSockets) |
| Voice/Video | WebRTC (peer-to-peer) |
| Backend | Supabase Edge Functions (Deno) |
| Database | PostgreSQL (Supabase) |
| Auth | Custom JWT (Edge Functions + localStorage) |
| Data Collector | Chrome Extension |

---

## 👥 Roles

| Role | Access |
|---|---|
| `EMPLOYEE` | Own workday, timesheet, tasks, chats |
| `MANAGER` | + Team overview, Browser History of team |
| `ADMIN` | + Admin panel (users/teams), all browser history |

---

## 📁 Complete File Map

### Root Files
| File | Purpose | Status |
|---|---|---|
| `.env` | Environment config | ⚠️ **Missing Supabase anon key** |
| `package.json` | Dependencies | ✅ Complete |
| `vite.config.ts` | Build config | ✅ Complete |
| `tailwind.config.ts` | Tailwind design tokens | ✅ Complete |
| `index.html` | App entry | ✅ Complete |

### `src/` — Frontend Application

#### Core App Files
| File | Purpose | Status |
|---|---|---|
| `src/App.tsx` | Routes + layout | ⚠️ Has **duplicate import** for `BrowserHistoryPage` (bug on line 23) |
| `src/main.tsx` | React entry point | ✅ |
| `src/index.css` | Global CSS + design tokens | ✅ |
| `src/App.css` | App-level CSS | ✅ |

#### `src/contexts/`
| File | Purpose | Status |
|---|---|---|
| `AuthContext.tsx` | Auth state + user object | ✅ |

#### `src/components/`
| File | Purpose | Status |
|---|---|---|
| `AppLayout.tsx` | Main layout wrapper | ✅ |
| `AppSidebar.tsx` | Navigation sidebar (role-aware) | ✅ |
| `NavLink.tsx` | Sidebar nav link | ✅ |
| `ProtectedRoute.tsx` | Auth guard for routes | ✅ |
| `chat/CallScreen.tsx` | Voice/video call UI | ✅ |
| `chat/ChatMessage.tsx` | Single message bubble | ✅ |
| `chat/ChatPanel.tsx` | Full chat panel | ✅ |
| `chat/ChatQuickActions.tsx` | Chat action buttons | ✅ |
| `chat/ChatWidget.tsx` | Floating chat widget | ✅ |
| `chat/IncomingCallDialog.tsx` | Incoming call dialog | ✅ |

#### `src/hooks/`
| File | Purpose | Status |
|---|---|---|
| `use-mobile.tsx` | Mobile detection | ✅ |
| `use-toast.ts` | Toast notifications | ✅ |
| `useWebRTC.ts` | WebRTC call management | ✅ Full implementation |

#### `src/lib/` — API Layer
| File | Purpose | Status |
|---|---|---|
| `auth.ts` | Login/logout/JWT management | ✅ |
| `admin-api.ts` | User/team/stats API | ✅ |
| `chat-api.ts` | Chat groups/messages API | ✅ |
| `tasks-api.ts` | Kanban tasks API | ✅ |
| `work-sessions-api.ts` | Sessions + browser history API | ✅ |
| `extension-activate.ts` | Sends login signal to Chrome Extension | ✅ |
| `utils.ts` | `cn()` classname helper | ✅ |

#### `src/pages/` — Page Components
| File | Purpose | Completeness |
|---|---|---|
| `LoginPage.tsx` | Login form | ✅ Full |
| `Dashboard.tsx` | Role-switching dashboard (Employee/Manager/Admin) | ✅ Full — **Employee version is static placeholder** |
| `EmployeeDashboardPage.tsx` | `/employee` — Clock In/Out + break management | ✅ Full |
| `TimesheetPage.tsx` | Session history + notes | ✅ Full |
| `AttendancePage.tsx` | Attendance records | ❌ **Placeholder only** (27 lines, no real data) |
| `ChatsPage.tsx` | Real-time chat + WebRTC calls | ✅ Full |
| `TasksPage.tsx` | Kanban board (To Do/In Progress/Done) | ✅ Full |
| `BrowserHistoryPage.tsx` | Browser activity (Admin/Manager) | ✅ Full (rich UI, filters, stats, timeline) |
| `TeamPage.tsx` | Team member list | ✅ Basic but functional |
| `AdminPage.tsx` | Admin panel root | ✅ (nav only) |
| `admin/AdminUsersPage.tsx` | Create/edit/deactivate users | ✅ Full |
| `admin/AdminTeamsPage.tsx` | Create teams, assign managers/members | ✅ Full |
| `admin/BrowserHistoryPage.tsx` | Simple table view for admin | ⚠️ Basic — no filters, just raw table |
| `NotFound.tsx` | 404 page | ✅ |

#### `src/integrations/`
| File | Purpose | Status |
|---|---|---|
| `supabase/` (client) | Supabase JS client | ✅ |

---

### `supabase/` — Backend

#### Edge Functions (`supabase/functions/`)
| Function | Endpoints | Status |
|---|---|---|
| `auth` | `/login`, `/signup`, `/me` | ✅ |
| `work-sessions` | `/status`, `/clock-in`, `/clock-out`, `/break-in`, `/break-out`, `/active-now`, `/team-overview`, `/history`, `/notes`, `/browser-history` | ✅ |
| `admin` | `/stats`, `/users`, `/users/:id`, `/teams`, `/teams/:id/members` | ✅ |
| `chat` | `/groups`, `/groups/:id/members`, `/groups/:id/messages`, `/search`, `/direct` | ✅ |
| `tasks` | `/tasks`, `/activity` | ✅ |
| **Screenshots** | _(none yet)_ | ❌ **Missing edge function** |

#### Database Migrations (`supabase/migrations/`)
16 migration files covering:
- Users, teams, devices, events tables
- Work sessions + breaks
- Attendance + corrections
- Chat groups, members, messages
- Tasks + activity
- `browser_history` table (added in migration `20260529`)
- Second browser history migration `20260723` (likely a fix/update)

---

### `extension/` — Chrome Extension

| File | Purpose | Status |
|---|---|---|
| `manifest.json` | Extension config (MV3) | ✅ Has `history`, `tabs`, `alarms`, `storage` permissions |
| `background.js` | Service worker: screenshots + history tracking | ✅ **Fully implemented** |
| `config.js` | Supabase URL/key config | ✅ |
| `popup.html` | Extension popup UI | ✅ |
| `popup.js` | Extension popup logic | ✅ |

**Extension Features Implemented:**
- ✅ 15-minute screenshot alarm (`chrome.alarms`) — uploads to Supabase Storage + inserts into `screenshots` table
- ✅ Browser history tracking via `chrome.history.onVisited` — batches and POSTs to Supabase REST API every 60 seconds

---

## 🗺️ Plan Files Overview

| File | Contents |
|---|---|
| `lc_monitor_analysis_and_plan.md` | Full project analysis + 6-phase feature implementation plan |
| `feature_comparison_lc_vs_handdy.md` | Detailed feature comparison with Handdy competitor |
| `scratchpad_rcuwjw3y.md` | Research notes from Handdy feature comparison task |
| `Feature_Implementation_Requirements.pdf` | Original requirements PDF |
| `LC_Monitor_Handoff_Guide.pdf` | Handoff guide PDF |

---

## 📊 Implementation Progress (from Plan)

### Phase 0: Unblock Setup
| Task | Status |
|---|---|
| Get Supabase anon key for `cuawkttwzfpjtqwjaybu` → update `.env` | ❌ **NOT DONE** — key is placeholder `[YOUR_NEW_ANON_KEY]` |
| Get Chrome Extension source code | ✅ Extension code IS in the repo (`/extension` folder) |
| Verify app runs locally | ❓ Unknown (depends on anon key) |

**Phase 0 Completion: ~33%**

---

### Phase 1: Chrome Extension — 15-Minute Screenshots
| Task | Status |
|---|---|
| Find existing screenshot logic in `background.js` | ✅ Done |
| Change trigger interval to 15 minutes | ✅ Already set to `periodInMinutes: 15` |
| Upload screenshots to Supabase Storage | ✅ Implemented in `takeScreenshot()` |
| Insert into `screenshots` DB table | ✅ Implemented |
| Test end-to-end | ❓ Blocked by missing anon key |

**Phase 1 Completion: ~90%** *(code done, needs testing with live Supabase)*

---

### Phase 2: Chrome Extension — Browser History Collection
| Task | Status |
|---|---|
| Add `"history"` and `"tabs"` to `manifest.json` | ✅ Already present |
| Add `chrome.history.onVisited` listener | ✅ Implemented |
| Track url, title, timestamp, duration | ✅ (duration is 0 — limitation noted in code comment) |
| Batch and POST to `/work-sessions/browser-history` | ⚠️ Posts to `/rest/v1/browser_history` directly (not via Edge Function) |
| API endpoint exists | ✅ `workSessionsApi.addBrowserHistory()` exists |

**Phase 2 Completion: ~80%** *(functional, but bypasses Edge Function — posts directly to REST API)*

---

### Phase 3: Screenshots Page — Web Dashboard
| Task | Status |
|---|---|
| Create `src/pages/ScreenshotsPage.tsx` | ❌ **NOT CREATED** |
| Add route `/screenshots` to `App.tsx` | ❌ Not added |
| Add "Screenshots" nav item to `AppSidebar.tsx` | ❌ Not added |
| Add `workSessionsApi.getScreenshots()` API method | ❌ Not added |
| Add screenshots Edge Function endpoint | ❌ Not built |

**Phase 3 Completion: 0%** *(nothing done)*

---

### Phase 4: Attendance Page — Full Implementation
| Task | Status |
|---|---|
| Calendar view with daily attendance status | ❌ Not built |
| Overtime/undertime calculation | ❌ Not built |
| Attendance correction request form | ❌ Not built |
| Manager approve/reject corrections | ❌ Not built |

> **Note:** `AttendancePage.tsx` is currently a 27-line placeholder showing "No attendance records yet."

**Phase 4 Completion: 0%** *(completely placeholder)*

---

### Phase 5: Employee Dashboard Enhancement
| Task | Status |
|---|---|
| Connect Employee `/` dashboard to `workSessionsApi.getStatus()` | ❌ Not done — still shows static zeros |
| Unify `EmployeeDashboardPage` with the Dashboard employee view | ❌ Two separate concepts still exist |

**Phase 5 Completion: 0%** *(Employee `/` route shows static "Not Clocked In", "0h 0m" placeholders)*

---

### Phase 6: Deployment Pipeline
| Task | Status |
|---|---|
| `npm run build` production bundle | ❓ Unknown |
| Upload to production server | ❓ Unknown |
| Ensure `supabase-proxy.php` on server | ❓ Unknown (PHP proxy file not in repo) |
| Upload Chrome Extension to Chrome Web Store | ❓ Unknown |

**Phase 6 Completion: Unknown** *(no production artifacts in repo)*

---

## 🐛 Known Bugs / Issues Found

| # | Issue | Location | Severity |
|---|---|---|---|
| 1 | **Duplicate import** — `BrowserHistoryPage` imported twice from different paths | `App.tsx` lines 20 & 23 | 🔴 **Build-breaking** |
| 2 | **Missing Supabase anon key** — app cannot connect to backend | `.env` line 5 | 🔴 **App-breaking** |
| 3 | **Admin Browser History page** (`admin/BrowserHistoryPage.tsx`) is a basic unfiltered table — inconsistent with the rich `BrowserHistoryPage.tsx` | Admin section | 🟡 UX issue |
| 4 | **Extension posts directly to Supabase REST** (bypassing Edge Function) — different auth model from web app | `extension/background.js` lines 150-159 | 🟡 Architecture concern |
| 5 | **Employee Dashboard** at `/` shows hardcoded "Not Clocked In" / "0h 0m" — not connected to API | `Dashboard.tsx` line 47-60 | 🟡 Functional gap |

---

## 📈 Overall Progress Summary

| Phase | Description | Completion |
|---|---|---|
| Phase 0 | Setup / Unblocking | 33% |
| Phase 1 | Extension: Screenshots | 90% |
| Phase 2 | Extension: Browser History | 80% |
| Phase 3 | Screenshots Page (Frontend) | **0%** |
| Phase 4 | Attendance Page (Full) | **0%** |
| Phase 5 | Employee Dashboard Enhancement | **0%** |
| Phase 6 | Deployment | Unknown |
| **Overall** | | **~43%** |

---

## 🎯 What To Do Next (Priority Order)

### 🔴 URGENT (Blockers)
1. **Fix duplicate import in `App.tsx`** — remove line 23 (`import BrowserHistoryPage from "@/pages/admin/BrowserHistoryPage"`) or rename the import alias
2. **Get Supabase anon key** and update `.env` → app cannot run without this

### 🟠 HIGH PRIORITY
3. **Build `ScreenshotsPage.tsx`** — full grid view with employee/date filters, Supabase Storage image display
4. **Add screenshots route + sidebar nav item** (`/screenshots`, MANAGER + ADMIN roles)
5. **Add `workSessionsApi.getScreenshots()` API method** + screenshots Edge Function

### 🟡 MEDIUM PRIORITY
6. **Build full `AttendancePage.tsx`** — calendar view, PRESENT/ABSENT/LEAVE status, correction requests, manager approval workflow
7. **Connect Employee Dashboard** to live API (`workSessionsApi.getStatus()`)

### 🟢 LOWER PRIORITY
8. **Standardize Admin Browser History** page to match the rich UI of the main `BrowserHistoryPage.tsx`
9. **Deployment** — build + proxy setup + Chrome Extension distribution
10. **Productivity features** (URL categorization, CSV export) — competitive gap vs Handdy
