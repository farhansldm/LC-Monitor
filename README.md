# LC Monitor

LC Monitor is an internal workforce monitoring and attendance platform for AIIDA. It combines a React web dashboard, Supabase PostgreSQL/Edge Functions, and a Chrome MV3 extension to manage employee work sessions, breaks, attendance, leave, screenshots, browser history, chat, tasks, reports, and HR/admin operations.

```
React/Vite Dashboard <-> Supabase Edge Functions <-> PostgreSQL
        |                         ^
        v                         |
 Chrome MV3 Extension ------------+
```

Active Supabase project reference: `ivipigucanknjjvmnble`

Do not commit `.env`, `extension/config.js`, or `public/supabase-proxy.php` when they contain real credentials.

## Documentation Map

| Document | Purpose |
| --- | --- |
| `README.md` | Project overview, setup, workflows, and day-to-day commands |
| `DEPLOYMENT.md` | Production deployment runbook and operational notes |
| `docs/ARCHITECTURE.md` | System architecture, data flow, security model, and module map |
| `docs/API_REFERENCE.md` | Edge Function endpoint reference used by the frontend and extension |
| `docs/CHROME_EXTENSION.md` | Browser extension setup, behavior, and troubleshooting |

## Tech Stack

| Area | Technology |
| --- | --- |
| Frontend | React 18, TypeScript, Vite |
| UI | Tailwind CSS, shadcn/ui, Radix UI, lucide-react |
| Routing | React Router DOM v6 |
| Data fetching | TanStack React Query v5 |
| Charts | Recharts |
| Backend | Supabase Edge Functions, Deno, TypeScript |
| Database | Supabase PostgreSQL |
| Realtime | Supabase Realtime and WebRTC for chat/calls |
| Extension | Chrome Extension Manifest V3 |
| Testing | Vitest, React Testing Library |

## Core Features

| Module | What it supports |
| --- | --- |
| Authentication | Custom email/password login, app-issued JWTs, role-aware sessions |
| Workday | Clock in/out, break in/out, active status, multi-session daily history |
| Attendance | Monthly attendance view, correction requests, manager/admin review |
| Timesheets | Session history, employee notes, manager comments, CSV export |
| Leave | Employee leave requests, manager/admin/HR approval, attendance sync |
| Shifts | Shift creation, user assignment, late and early flagging |
| Teams | Team assignment, manager overview, active employees |
| Departments | Admin-managed departments and user department assignment |
| Reports | Date, employee, department, WFH/site, late, and early filters |
| Analytics | Monthly hours, break averages, WFH/site split, late/early counts |
| Policies | Employee policy reading and admin/HR policy management |
| Monitoring | Screenshot upload, browser-history duration tracking, manager views |
| Chat | Groups, direct messages, message search, WebRTC call UI |
| Tasks | Kanban-style task CRUD and activity history |
| Email | Welcome, leave, test, missed clock-out, and daily-summary notifications |
| Audit | Admin/HR audit logs for operational changes |

## Roles

| Role | Access summary |
| --- | --- |
| `EMPLOYEE` | Dashboard, workday, timesheet, attendance, leave, policies, chat, tasks |
| `MANAGER` | Employee access plus team overview, reports, screenshots, browser history, approvals |
| `HR_MANAGER` | Admin-level HR/admin access without being named `ADMIN` |
| `ADMIN` | Full user, team, department, shift, policy, IP, audit, analytics, and email administration |

Role helpers live in `src/lib/roles.ts`.

## Quick Start

### Prerequisites

- Node.js 18 or newer
- npm
- Supabase CLI for database/function deployment
- Chrome or another Chromium browser for extension testing

### Install and run

```bash
npm install
npm run dev
```

The Vite dev server runs on:

```text
http://localhost:8080
```

### Environment files

Copy the example files before local development:

```text
.env.example                      -> .env
extension/config.example.js       -> extension/config.js
public/supabase-proxy.example.php -> public/supabase-proxy.php
```

Frontend environment variables:

```env
VITE_SUPABASE_PROJECT_ID=your_project_ref
VITE_SUPABASE_URL=https://your_project_ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_public_key
VITE_EXTENSION_ID=
```

Backend Supabase secrets:

```text
JWT_SECRET
RESEND_API_KEY
RESEND_FROM
CRON_SECRET
APP_URL
```

`JWT_SECRET` is required by `auth`, `admin`, `work-sessions`, `chat`, and `tasks`. Changing it invalidates existing sessions.

## Common Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local Vite app |
| `npm run build` | Create a production build in `dist/` |
| `npm run build:dev` | Build using Vite development mode |
| `npm run preview` | Preview the built app locally |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Vitest once |
| `npm run test:watch` | Run Vitest in watch mode |

## Project Structure

```text
Lc-Monitor-main/
|-- src/
|   |-- App.tsx                         # Routes and providers
|   |-- main.tsx                        # React entry point
|   |-- contexts/                       # Auth and theme contexts
|   |-- components/                     # Layout, sidebar, protected routes, UI, chat
|   |-- pages/                          # Route pages
|   |-- pages/admin/                    # Admin and HR management pages
|   |-- lib/                            # API clients, auth helpers, roles, utilities
|   |-- hooks/                          # App hooks, including WebRTC
|   |-- integrations/supabase/          # Generated Supabase client/types
|   |-- test/                           # Vitest setup and examples
|-- supabase/
|   |-- functions/                      # Edge Functions
|   |-- migrations/                     # PostgreSQL schema migrations
|   |-- config.toml                     # Supabase local/project config
|-- extension/                         # Chrome MV3 extension
|-- public/
|   |-- supabase-proxy.example.php      # Production Edge Function proxy template
|-- docs/                              # Architecture/API/extension documentation
|-- DEPLOYMENT.md                      # Production runbook
```

## Application Routes

| Path | Page | Intended roles |
| --- | --- | --- |
| `/login` | Login | Public |
| `/` | Dashboard | All authenticated users |
| `/employee` | My Workday | All authenticated users |
| `/timesheet` | Timesheet | All authenticated users |
| `/attendance` | Attendance | All authenticated users |
| `/leave` | Leave Requests | All authenticated users |
| `/reports` | Reports | Manager, HR Manager, Admin |
| `/policies` | Policies | All users; write access for HR/Admin |
| `/chats` | Chat | All authenticated users |
| `/tasks` | Tasks | All authenticated users |
| `/team` | Team Overview | Manager, HR Manager, Admin |
| `/browser-history` | Browser History | Manager, HR Manager, Admin |
| `/screenshots` | Screenshots | Manager, HR Manager, Admin |
| `/admin` | Admin Home | HR Manager, Admin |
| `/admin/users` | User Management | HR Manager, Admin |
| `/admin/teams` | Team Management | HR Manager, Admin |
| `/admin/browser-history` | Admin Browser History | HR Manager, Admin |
| `/admin/shifts` | Shift Scheduling | HR Manager, Admin |
| `/admin/departments` | Departments | HR Manager, Admin |
| `/admin/analytics` | Analytics | HR Manager, Admin |
| `/admin/audit-logs` | Audit Logs | HR Manager, Admin |
| `/admin/ip-config` | Trusted IP Ranges | HR Manager, Admin |
| `/admin/email` | Email Settings | HR Manager, Admin |

The route tree is defined in `src/App.tsx`; role-sensitive page behavior is enforced in UI code and Edge Functions.

## Authentication Model

LC Monitor uses custom authentication implemented in `supabase/functions/auth/index.ts`.

1. Users submit email and password to `/functions/v1/auth/login`.
2. The function validates credentials against the `users` table.
3. Passwords are verified with PBKDF2; legacy SHA-256 hashes are migrated on successful login.
4. The function signs a 24-hour HS256 JWT using `JWT_SECRET`.
5. The frontend stores the token in local storage and sends it as `Authorization: Bearer <token>`.
6. Edge Functions verify the JWT and enforce role/team access.

The frontend auth helpers live in `src/lib/auth.ts` and `src/contexts/AuthContext.tsx`.

## Backend Overview

Supabase Edge Functions:

| Function | Responsibility |
| --- | --- |
| `auth` | Login, signup, current user |
| `work-sessions` | Clocking, breaks, attendance, leave, shifts, reports, screenshots, browser history |
| `admin` | Users, teams, departments, policies, IP ranges, audit logs, email checks |
| `chat` | Groups, direct messages, members, messages, search |
| `tasks` | Task CRUD and task activity |
| `notifications` | Resend email delivery and scheduled notification jobs |

Frontend API wrappers live in `src/lib/*-api.ts`.

In development the app calls Edge Functions directly:

```text
https://<project-ref>.supabase.co/functions/v1/<function>
```

In production the app calls the PHP proxy:

```text
/supabase-proxy.php?path=<function>/<endpoint>
```

## Database Overview

The schema is managed by SQL files in `supabase/migrations/`.

Core tables:

```text
users
teams
devices
events
work_sessions
breaks
attendance
attendance_corrections
screenshots
browser_history
chat_groups
chat_group_members
chat_messages
tasks
task_activity
departments
shifts
user_shifts
leave_requests
policies
office_ip_ranges
```

Important enums include `user_role`, `user_status`, `event_type`, `session_source`, `attendance_status`, `correction_status`, `task_status`, and `task_priority`.

## Chrome Extension

The extension in `extension/` is a Chrome Manifest V3 extension. It stores the app session, listens for clock-in and clock-out messages, captures screenshots while the user is clocked in, and uploads browser-history duration data.

Load it locally:

1. Open `chrome://extensions`.
2. Enable Developer Mode.
3. Click Load unpacked.
4. Select the `extension/` folder.
5. Log in to the web dashboard and clock in.

See `docs/CHROME_EXTENSION.md` for full setup and troubleshooting.

## Development Workflow

1. Pull the latest code and install dependencies with `npm install`.
2. Copy and fill `.env`, `extension/config.js`, and `public/supabase-proxy.php` from their examples.
3. Run `npm run dev`.
4. Use the Supabase-hosted Edge Functions for local backend calls.
5. Load the extension from `extension/` only when testing monitoring behavior.
6. Run `npm run lint` and `npm run test` before shipping changes.
7. Build with `npm run build` before deploying the frontend.

## Deployment Summary

High-level production steps:

1. Link the Supabase project with `npx supabase link --project-ref <project-ref>`.
2. Set required secrets, especially `JWT_SECRET`.
3. Apply database migrations with `npx supabase db push`.
4. Ensure the `screenshots` storage bucket exists.
5. Deploy Edge Functions.
6. Build the frontend with `npm run build`.
7. Upload the contents of `dist/` to a PHP-capable host.
8. Confirm `supabase-proxy.php` is deployed and points at the correct project.
9. Load/package the Chrome extension and configure the extension ID if needed.

Use `DEPLOYMENT.md` as the full runbook.

## Email and Scheduled Jobs

Emails are handled by the `notifications` Edge Function. If `RESEND_API_KEY` is missing, the function returns stubbed email responses instead of sending real email.

Supported notification types:

```text
leave
leave-submitted
welcome
test
missed-clock-out
daily-summary
```

Scheduled jobs must be authorized with `x-cron-secret` matching `CRON_SECRET`, or with the Supabase service role key.

## Testing

The project is configured for Vitest with jsdom and React Testing Library.

```bash
npm run test
npm run lint
```

Current tests live in `src/test/`. Add focused tests around shared helpers, API wrappers, and high-risk UI workflows when modifying behavior.

## Troubleshooting

| Problem | Likely cause | Fix |
| --- | --- | --- |
| Login fails for every user | Missing or changed `JWT_SECRET` | Set the secret and redeploy `auth` |
| Production API calls fail | Proxy missing or wrong project URL | Deploy/fix `public/supabase-proxy.php` |
| Screenshots do not appear | Extension not loaded, not clocked in, or bucket missing | Load extension, clock in, create `screenshots` bucket |
| Browser history is empty | Extension has no session or user is clocked out | Log in, clock in, and check extension storage |
| Emails are stubbed | `RESEND_API_KEY` not set | Set Resend secrets and redeploy notification-related functions |
| Managers cannot see team data | Missing `team_id` or manager relationship | Check users and teams in Admin |
| WFH/site classification is wrong | Trusted office IP ranges are missing | Add CIDR ranges under Admin -> Trusted IPs |

## Security Notes

- Real secrets must stay out of git.
- Edge Functions use the Supabase service role key server-side; never expose it to the browser.
- The frontend stores only the app JWT and user profile in local storage.
- Production requests should go through the PHP proxy only when direct Edge Function CORS is not suitable.
- Admin and manager authorization must be enforced server-side, not only through hidden UI.

## Maintenance Notes

- Keep migrations append-only unless you are intentionally rebuilding a development database.
- Update `src/integrations/supabase/types.ts` when the database schema changes.
- Keep frontend API wrappers aligned with Edge Function endpoints.
- Update this README and the relevant `docs/` file whenever a workflow, route, function, or environment variable changes.
