# Feature Comparison: LC Monitor vs Handdy

> **Comparison Date:** August 2026  
> **Handdy Source:** [https://www.handdy.com](https://www.handdy.com)  
> **LC Monitor Source:** Codebase + implementation docs in this repository

---

## Overview

| | LC Monitor | Handdy |
|---|---|---|
| **Type** | All-in-one workforce platform (monitoring + collaboration) | Dedicated employee monitoring & productivity analytics tool |
| **Client** | Chrome Browser Extension (lightweight) | Desktop App: Windows, macOS, Ubuntu Linux |
| **Deployment** | Web app + Chrome Extension | Web Dashboard + Desktop Timer |
| **Primary Audience** | Internal teams of a single company | Any business (SMB to Enterprise) |
| **Pricing** | Custom / internal build | Pro: ~$2.24/user/mo · Premium: adds monitoring features |

---

## ✅ Features Present in BOTH

These features exist in both products:

| Feature | LC Monitor | Handdy | Notes |
|---|---|---|---|
| **Clock In / Clock Out** | ✅ Full | ✅ Full | Both track precise start/end of workday |
| **Break Tracking** | ✅ Full | ✅ Full | LC calls them break sessions; Handdy tracks breaks as intervals |
| **Daily Timesheets** | ✅ Full | ✅ Full | Both show daily/weekly/monthly hour summaries |
| **Website / Browser History Tracking** | ✅ Full | ✅ Full | LC uses Chrome Extension; Handdy uses Desktop App |
| **Screenshot Capture** | ⚠️ Planned (15-min interval) | ✅ Full (Premium+) | LC has DB table ready; Extension code pending |
| **Admin / Manager Dashboard** | ✅ Full | ✅ Full | Centralized view of team activity |
| **User & Team Management** | ✅ Full | ✅ Full | Create users, assign to teams |
| **Role-Based Access** | ✅ 3 roles (Employee, Manager, Admin) | ✅ Admin vs Employee | LC has more granular roles |
| **Live "Who's Working" View** | ✅ Admin dashboard shows active employees | ✅ Real-time online status | Both surface active employee visibility |
| **Session / Activity Reports** | ✅ Full | ✅ Full | Historical reports on time worked |
| **Attendance Records** | ✅ Full (DB schema + status tracking) | ✅ Full | Both track PRESENT/ABSENT/LEAVE |

---

## 🟢 Features EXCLUSIVE to LC Monitor

These features exist in LC Monitor but are **absent in Handdy**:

### 💬 Communication & Collaboration
| Feature | Details |
|---|---|
| **Internal Real-time Team Chat** | Group chats (General, Team, Project types) + Direct Messages. Handdy has zero communication tools. |
| **Voice Calling (WebRTC)** | Browser-native peer-to-peer voice calls within the platform via WebRTC + Supabase Realtime signaling. |
| **Video Calling (WebRTC)** | Full video calls with mute/unmute, camera toggle. No third-party integrations needed. |
| **Screen Sharing (in calls)** | Share screen during a video call, switch back to camera. Built natively. |
| **Chat Message Search** | Full-text search across all chat messages across all groups. |

### 📋 Task Management
| Feature | Details |
|---|---|
| **Kanban Task Board** | Visual Kanban board with 3 columns: To Do, In Progress, Done. Handdy has no task management. |
| **Task Assignment** | Assign tasks to employees with due dates and priorities (Low / Medium / High / Urgent). |
| **Task Activity Log** | Full audit trail per task: who changed what, when (title, status, priority, assignee). |
| **Task Priority Levels** | 4 tiers: Low, Medium, High, Urgent. |

### 🧑‍💼 Admin Features
| Feature | Details |
|---|---|
| **Attendance Correction Requests** | Employees can submit time correction requests; Managers/Admins approve or reject them. Handdy has no correction workflow. |
| **Session Notes** | Employees can add notes to their work sessions. |
| **Credential Display on User Creation** | After creating a new user, credentials are shown with a "Copy" button for easy sharing. |

### 🖥️ Technical / Deployment
| Feature | Details |
|---|---|
| **Browser Extension Client (lightweight)** | Runs as a Chrome Extension — no desktop app download required. Less invasive to install. |
| **PHP CORS Proxy** | Built-in production PHP proxy (`supabase-proxy.php`) to route API calls through the same domain, avoiding CORS issues in shared hosting environments. |

---

## 🔴 Features EXCLUSIVE to Handdy

These features exist in Handdy but are **absent in LC Monitor**:

### 📊 Deep Monitoring & Analytics
| Feature | Details |
|---|---|
| **Desktop Application Usage Tracking** | Tracks exactly which native apps employees use (e.g., Photoshop, VS Code, Word, Excel) with time spent. LC Monitor only tracks browser URLs — no desktop app tracking at all. |
| **Keystroke Activity Monitoring** | Counts keystrokes and mouse clicks per interval to detect active vs. idle state. LC Monitor has no input activity detection. |
| **Idle Detection** | Detects when keyboard/mouse is idle and pauses the "active" timer accordingly. LC has idle detection only via extension events — no keystroke-level granularity. |
| **Productivity Categorization** | Admins can classify apps and websites as "Productive", "Unproductive", or "Neutral". Handdy then auto-calculates a productivity score per employee. LC Monitor shows raw URLs only. |
| **Productivity Score / Reports** | Automated productivity % score per employee per day/week/month based on categorized time. Charts and trends. LC Monitor has no productivity scoring at all. |
| **Project-Level Time Tracking** | Employees can log time against specific named projects in Handdy. LC Monitor only tracks total session time, not project breakdowns. |
| **Billable Hours Tracking** | Mark time entries as billable and generate client billing reports. Not present in LC Monitor. |
| **Customizable Screenshot Intervals** | Admins can choose screenshot frequency (e.g., every 5, 10, 15 minutes). LC Monitor has only a fixed 15-minute interval (planned). |
| **Screenshot Blur / Privacy Mode** | Handdy Premium can blur screenshots for sensitive content or role-based viewing. LC Monitor has no blur option. |

### 🌐 Infrastructure & Security
| Feature | Details |
|---|---|
| **Offline Tracking** | Handdy's desktop app tracks time, app usage, screenshots, and activity even when there's no internet. Data syncs when the connection is restored. LC Monitor's extension requires a live connection. |
| **IP Address Restriction** | Restrict access or time tracking to authorized office IP ranges. Remote workers outside the IP range can be flagged. LC Monitor has no IP-based restrictions. |
| **Geolocation Tracking** | Some Handdy plans support location tracking to verify where employees are working from. Not in LC Monitor. |
| **Multi-OS Desktop Client** | Handdy has native desktop apps for **Windows, macOS, and Ubuntu Linux** — captures all OS-level activity. LC Monitor's Chrome Extension only works in a Chrome browser on any OS. |

### 📈 Reporting & Integrations
| Feature | Details |
|---|---|
| **Exportable Reports (PDF/CSV)** | Handdy lets admins export all reports (timesheets, productivity, screenshots) as PDF or CSV. LC Monitor has no export function. |
| **Automated Productivity Dashboards** | Pre-built analytics dashboards with graphs, trend lines, team comparisons. LC Monitor's admin dashboard is more of a live summary, not a deep analytics view. |
| **Custom Integrations (Enterprise)** | Handdy Enterprise offers custom API integrations with HR/payroll systems. LC Monitor has no third-party integrations. |
| **Payroll Integration** | Handdy can integrate work hours with payroll tools. LC Monitor has no payroll features. |
| **Free Tier (public product)** | Handdy has a free plan for small teams. LC Monitor is a private internal build with no tiered licensing. |

---

## 📊 Feature Comparison Summary Table

| Category | Feature | LC Monitor | Handdy |
|---|---|---|---|
| **Time Tracking** | Clock In/Out | ✅ | ✅ |
| | Break Tracking | ✅ | ✅ |
| | Timesheets | ✅ | ✅ |
| | Project-based time logging | ❌ | ✅ |
| | Billable hours | ❌ | ✅ |
| | Offline time tracking | ❌ | ✅ |
| **Monitoring** | Browser/website history | ✅ | ✅ |
| | Screenshots | ⚠️ Planned | ✅ |
| | Desktop app usage | ❌ | ✅ |
| | Keystroke monitoring | ❌ | ✅ |
| | Idle detection | ⚠️ Basic | ✅ Advanced |
| | Geolocation tracking | ❌ | ✅ |
| **Productivity** | Productivity scoring | ❌ | ✅ |
| | Category classification (URLs/apps) | ❌ | ✅ |
| | Analytics dashboards | ⚠️ Basic | ✅ Advanced |
| | Exportable reports (PDF/CSV) | ❌ | ✅ |
| **Communication** | Team chat | ✅ | ❌ |
| | Direct messages | ✅ | ❌ |
| | Voice calling | ✅ | ❌ |
| | Video calling | ✅ | ❌ |
| | Screen sharing | ✅ | ❌ |
| **Task Management** | Kanban board | ✅ | ❌ |
| | Task assignment + priority | ✅ | ❌ |
| | Task activity log | ✅ | ❌ |
| **Administration** | User management | ✅ | ✅ |
| | Team management | ✅ | ✅ |
| | Role-based access | ✅ 3 roles | ✅ 2 roles |
| | Attendance corrections | ✅ | ❌ |
| | IP Restriction | ❌ | ✅ |
| **Client / Platform** | Chrome Extension | ✅ | ❌ |
| | Windows desktop app | ❌ | ✅ |
| | macOS desktop app | ❌ | ✅ |
| | Linux desktop app | ❌ | ✅ |
| **Integrations** | Third-party HR/Payroll | ❌ | ✅ Enterprise |
| | Public API | ❌ | ✅ Enterprise |

---

## 🧭 Strategic Assessment

### Where LC Monitor **wins**
- **Collaboration-first**: The built-in chat, voice/video calling, and task board make LC Monitor a unified workplace platform — not just a monitoring tool. This is a significant differentiator that Handdy completely lacks.
- **Lightweight deployment**: A Chrome Extension is far less intrusive to install than a full desktop agent. No IT provisioning needed.
- **Attendance workflow**: The correction request → approval workflow is more mature than anything Handdy offers.

### Where Handdy **wins**
- **Depth of monitoring**: Handdy tracks everything at the OS level — keystrokes, mouse activity, desktop apps, and even works offline. LC Monitor is browser-only.
- **Productivity intelligence**: Handdy's categorization engine and automated productivity scoring gives managers actionable insight, not just raw data.
- **Reporting & exports**: Handdy has full PDF/CSV export, trend analysis, and payroll-ready reports. LC Monitor has no export functionality.
- **Cross-platform**: Handdy works on Windows, Mac, and Linux. LC Monitor's extension only works in Google Chrome.

### Gap Summary for LC Monitor
If you want LC Monitor to be competitive with Handdy on monitoring depth, the highest-impact gaps to close are:

| Priority | Gap | Effort |
|---|---|---|
| 🔴 High | Productivity categorization of URLs | Medium |
| 🔴 High | Export timesheets/reports as CSV | Low |
| 🟡 Medium | Desktop app usage tracking | Very High (requires native client) |
| 🟡 Medium | Keystroke/mouse activity monitoring | High (requires extension changes) |
| 🟢 Low | IP address restriction | Low |
| 🟢 Low | Offline tracking | High |
