# LC Monitor — 8-Day Sprint Plan

> **Start Date:** August 7, 2026  
> **Goal:** Complete all pending features, fix bugs, and ship a production-ready build.  
> **Current Completion:** ~43%

---

## 🔴 Pre-Day 1 Blocker (Do First)

> [!CAUTION]
> The app **cannot run at all** until this is done. Before starting Day 1 work:
> - Get the **Supabase anon key** for project `cuawkttwzfpjtqwjaybu` from the previous dev (Mantasha) or the Supabase dashboard
> - Paste it in `.env`: `VITE_SUPABASE_PUBLISHABLE_KEY="eyJ..."`

---

## 📅 Day 1 — Environment Setup + Bug Fixes

**Goal:** Get the app running locally and clean up all existing bugs.

### Tasks
- [ ] Update `.env` with the real Supabase anon key
- [ ] Run `npm install` and `npm run dev` — verify the app loads
- [ ] ~~Fix duplicate `BrowserHistoryPage` import in `App.tsx`~~ ✅ **Already fixed** (renamed admin import to `AdminBrowserHistoryPage`)
- [ ] Verify all existing pages load without errors (login, dashboard, timesheet, chats, tasks, browser history, admin)
- [ ] Check the Chrome Extension (`/extension`) works — load it in Chrome as unpacked, log in from popup, verify it activates
- [ ] Note any other runtime errors → create a bug list

### Files Touched
- [`.env`](file:///d:/SLDM/Lc-Monitor-main/.env)
- [`src/App.tsx`](file:///d:/SLDM/Lc-Monitor-main/src/App.tsx) ✅ (already fixed)

### Deliverable
> App runs locally. All current pages accessible. No build errors.

---

## 📅 Day 2 — Screenshots Page (Frontend UI)

**Goal:** Build the full Screenshots page so Admins/Managers can view employee screenshots.

### Tasks
- [ ] Create `src/pages/ScreenshotsPage.tsx`
  - Employee selector dropdown (fetch from `adminApi.getUsers()`)
  - Date picker (default today)
  - Grid view of screenshots (thumbnails from Supabase Storage public URLs)
  - Click thumbnail → modal with full-size image
  - Empty state when no screenshots found
  - Skeleton loading state
- [ ] Add `workSessionsApi.getScreenshots(userId: string, date: string)` method to `src/lib/work-sessions-api.ts`
- [ ] Add route `/screenshots` to `src/App.tsx`
- [ ] Add **"Screenshots"** nav item to `src/components/AppSidebar.tsx` (visible to MANAGER + ADMIN only)

### Files to Create / Modify
- **[NEW]** `src/pages/ScreenshotsPage.tsx`
- [`src/lib/work-sessions-api.ts`](file:///d:/SLDM/Lc-Monitor-main/src/lib/work-sessions-api.ts)
- [`src/App.tsx`](file:///d:/SLDM/Lc-Monitor-main/src/App.tsx)
- [`src/components/AppSidebar.tsx`](file:///d:/SLDM/Lc-Monitor-main/src/components/AppSidebar.tsx)

### Deliverable
> Screenshots page renders (with mock data or empty state). Nav item appears for Manager/Admin.

---

## 📅 Day 3 — Screenshots Backend (Supabase Edge Function + DB)

**Goal:** Wire up the screenshots API so the frontend can actually fetch screenshot data.

### Tasks
- [ ] Check if `screenshots` table exists in Supabase (the extension already inserts into it)
  - If not: write migration `supabase/migrations/YYYYMMDD_create_screenshots_table.sql`
  - Columns: `id`, `user_id`, `storage_path`, `taken_at`, `is_blurred`
- [ ] Check if Supabase Storage bucket `screenshots` exists — create if not
- [ ] Add `/screenshots` endpoint to the `work-sessions` Edge Function
  - `GET /work-sessions/screenshots?user_id=X&date=YYYY-MM-DD`
  - Returns array of `{ id, storage_path, taken_at, public_url }`
  - Generate public URLs from storage: `SUPABASE_URL/storage/v1/object/public/screenshots/{path}`
- [ ] Test end-to-end: clock in → wait for extension to fire → screenshot appears on page

### Files to Create / Modify
- `supabase/migrations/YYYYMMDD_create_screenshots_table.sql` (if needed)
- `supabase/functions/work-sessions/index.ts` — add `/screenshots` GET handler
- [`src/lib/work-sessions-api.ts`](file:///d:/SLDM/Lc-Monitor-main/src/lib/work-sessions-api.ts) — finalize `getScreenshots()`

### Deliverable
> Real screenshots appear in the Screenshots page pulled from Supabase Storage.

---

## 📅 Day 4 — Attendance Page (Full Implementation)

**Goal:** Replace the placeholder `AttendancePage.tsx` (currently 27 lines) with a real, working attendance tracker.

### Tasks
- [ ] Build calendar-style monthly view showing status per day:
  - 🟢 **PRESENT** — worked that day
  - 🔴 **ABSENT** — no session recorded
  - 🟡 **LEAVE** — marked as leave
  - ⬜ **HOLIDAY** — future enhancement
- [ ] Show summary stats: Total Present / Absent / Leave days this month
- [ ] **Attendance Correction Request form:**
  - Employee selects a past date + types a reason → submits to `attendance_corrections` table
  - Status shows: Pending / Approved / Rejected
- [ ] **Manager view:** Table of pending corrections with Approve / Reject buttons
- [ ] Add `attendanceApi` methods to a new `src/lib/attendance-api.ts` file
  - `getAttendance(month, year)` — employee's own month attendance
  - `getCorrections()` — employee's submitted corrections
  - `submitCorrection(date, reason)` — POST new correction
  - `reviewCorrection(id, action)` — Manager approve/reject (MANAGER/ADMIN only)

### Files to Create / Modify
- [`src/pages/AttendancePage.tsx`](file:///d:/SLDM/Lc-Monitor-main/src/pages/AttendancePage.tsx) — rewrite completely
- **[NEW]** `src/lib/attendance-api.ts`
- Add edge function endpoints for attendance if not already present

### Deliverable
> Attendance page shows real monthly calendar data. Employees can submit correction requests. Managers can approve/reject.

---

## 📅 Day 5 — Employee Dashboard (Live Data)

**Goal:** Connect the Employee role's main dashboard (at `/`) to real API data instead of hardcoded zeros.

### Tasks
- [ ] In `Dashboard.tsx`, update `EmployeeDashboard()` component:
  - Call `workSessionsApi.getStatus()` (already used in `EmployeeDashboardPage.tsx`)
  - Show live clock-in status: "Working", "On Break", "Not Clocked In"
  - Show today's actual hours (formatted, updating live)
  - Show this week's total hours
- [ ] Add a **quick "Clock In" / "Clock Out" button** directly on the dashboard card
- [ ] Consider: should `/` for employees just redirect to `/employee`? Or stay as summary? Decide and implement.
- [ ] **Unify the two dashboard concepts** — `EmployeeDashboardPage` (at `/employee`) is the full workday view; `/` should be a clean summary overview with a link to the full workday page.

### Files to Modify
- [`src/pages/Dashboard.tsx`](file:///d:/SLDM/Lc-Monitor-main/src/pages/Dashboard.tsx) — update `EmployeeDashboard` function (lines 47-61)

### Deliverable
> Employee sees live clock-in status and real hours on their dashboard. No more hardcoded zeros.

---

## 📅 Day 6 — UI Polish & Consistency

**Goal:** Clean up inconsistencies across pages and ensure premium UI quality throughout.

### Tasks
- [ ] **Upgrade `admin/BrowserHistoryPage.tsx`** — currently a basic unstyled table. Bring it to par with the main `BrowserHistoryPage.tsx` (add filters, stats header, styled table)
- [ ] **Team Page** (`TeamPage.tsx`) — currently uses generic styling. Update to match the design system (card-premium, section-labels, role badges matching the rest of the app)
- [ ] **Audit all pages** for design consistency:
  - Check all pages use `page-heading` and `page-subheading` classes
  - Check all cards use `card-premium`
  - Check all tables use the styled table component
- [ ] Test **mobile responsiveness** — sidebar collapse, tables scroll on small screens
- [ ] Fix any lint/TypeScript warnings

### Files to Modify
- [`src/pages/admin/BrowserHistoryPage.tsx`](file:///d:/SLDM/Lc-Monitor-main/src/pages/admin/BrowserHistoryPage.tsx)
- [`src/pages/TeamPage.tsx`](file:///d:/SLDM/Lc-Monitor-main/src/pages/TeamPage.tsx)
- Various other pages as audit reveals

### Deliverable
> All pages look consistent and polished. Admin browser history page has filters. No obvious UI regressions.

---

## 📅 Day 7 — Chrome Extension Polish + End-to-End Testing

**Goal:** Verify the extension works end-to-end and fix any integration issues.

### Tasks
- [ ] **Extension browser history**: The extension currently POSTs directly to `supabase REST API` (`/rest/v1/browser_history`) instead of going through the Edge Function (`/work-sessions/browser-history`). Decide which is correct and make consistent.
- [ ] **Duration tracking**: `duration_seconds` is hardcoded to `0` in extension. Implement actual duration tracking using tab focus events (`chrome.tabs.onActivated` + timestamps).
- [ ] **Test screenshot flow end-to-end:**
  - Log in → extension activates → wait 15 min → verify screenshot in Supabase Storage → verify it appears on Screenshots Page
- [ ] **Test browser history flow:**
  - Browse sites → verify they appear in Browser History page within 1 minute
- [ ] **Test attendance correction flow:**
  - Submit correction as employee → approve as manager → verify status updates
- [ ] Fix any bugs discovered during testing

### Files to Modify
- [`extension/background.js`](file:///d:/SLDM/Lc-Monitor-main/extension/background.js)

### Deliverable
> Extension fully tested. Browser history has real durations. All data flows from extension → Supabase → Dashboard confirmed working.

---

## 📅 Day 8 — Deployment + Final QA

**Goal:** Build and deploy the production version of the app.

### Tasks
- [ ] Run `npm run build` — confirm no build errors
- [ ] Test the production build locally (`npx serve dist`)
- [ ] Confirm `supabase-proxy.php` is available on the production server (contact previous dev for server details)
- [ ] Upload production build files to web server
- [ ] Update `.env` production values (or server-side env config)
- [ ] Test production deployment:
  - Login works
  - All pages load
  - Real-time chat works
  - Extension connects to production backend
- [ ] **Chrome Extension deployment:**
  - If Chrome Web Store: upload new `extension/` folder as a new version
  - If manual: zip and distribute to employees
- [ ] Write a brief **Deployment Runbook** documenting how to redeploy in the future

### Files / Commands
- `npm run build`
- `supabase/` — deploy edge functions: `supabase functions deploy`

### Deliverable
> Live production app at company URL with all features working. Extension distributed to employees.

---

## 📊 Day-by-Day Summary

| Day | Focus | Key Output | Est. Effort |
|---|---|---|---|
| **Day 1** | Setup + Bug Fixes | App runs, all pages load | 3–4 hrs |
| **Day 2** | Screenshots Page UI | Frontend screenshots page complete | 4–6 hrs |
| **Day 3** | Screenshots Backend | Real screenshots visible in app | 4–5 hrs |
| **Day 4** | Attendance Page | Full calendar + correction workflow | 6–8 hrs |
| **Day 5** | Employee Dashboard | Live clock data on dashboard | 2–3 hrs |
| **Day 6** | UI Polish | Consistent design, admin history page | 3–4 hrs |
| **Day 7** | Extension Testing | Full end-to-end verified | 4–6 hrs |
| **Day 8** | Deployment | Live in production | 4–5 hrs |
| **Total** | | **Project complete** | ~30–41 hrs |

---

## ⚠️ Risks & Dependencies

| Risk | Impact | Mitigation |
|---|---|---|
| Supabase anon key not received | 🔴 Blocks Day 1 entirely | Chase Mantasha immediately |
| `supabase-proxy.php` not on server | 🔴 Blocks deployment | Get server access details |
| `screenshots` table doesn't exist | 🟡 Delays Day 3 | Write migration on Day 3 |
| Chrome Web Store review takes time | 🟡 Delays extension rollout | Start CWS submission on Day 7 |
| Extension auth model mismatch | 🟡 History may not appear | Resolve Day 7 |
