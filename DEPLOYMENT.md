# How to run LC Monitor

Keys live in `.env`, `extension/config.js`, and `public/supabase-proxy.php`. Copy the `.example` files if you start from a clone:

```
.env.example                     → .env
extension/config.example.js      → extension/config.js
public/supabase-proxy.example.php → public/supabase-proxy.php
```

Do not commit `.env`.

You need Node.js 18+ and [Supabase CLI](https://supabase.com/docs/guides/cli).

---

## First time (this Supabase project)

```bash
npx supabase login
npx supabase link --project-ref ivipigucanknjjvmnble
```

Set a login secret (any long random string). Do not change it later or everyone is logged out.

```bash
npx supabase secrets set JWT_SECRET=paste-a-long-random-string
```

Create tables. If this fails, open Supabase → SQL Editor and paste the files in `supabase/migrations/` oldest first.

```bash
npx supabase db push
```

In Supabase → Storage, make sure a public bucket named `screenshots` exists.

Upload the backend:

```bash
npx supabase functions deploy auth
npx supabase functions deploy work-sessions
npx supabase functions deploy admin
npx supabase functions deploy chat
npx supabase functions deploy tasks
npx supabase functions deploy notifications
```

Create the first admin. In **PowerShell** (Windows):

```powershell
$body = '{"email":"admin@lemoncode.com","password":"admin123","first_name":"Admin","last_name":"User","role":"ADMIN"}'
Invoke-RestMethod -Uri "https://ivipigucanknjjvmnble.supabase.co/functions/v1/auth/signup" -Method POST -ContentType "application/json" -Body $body
```

Password must be at least 8 characters. Then log in on the website. Add other people under Admin → Users.

---

## Run on your computer

```bash
npm install
npm run dev
```

Open http://localhost:8080

---

## Put it on the web

On your computer, build the site:

```bash
npm run build
```

That creates a `dist/` folder. Inside it you should see `index.html` and `supabase-proxy.php`.

Copy **everything inside `dist/`** to your website folder on the host (`public_html`, `htdocs`, or `www`). Use FTP, cPanel File Manager, or your host’s upload tool.

The host must support **PHP**. After upload, open:

`https://your-domain.com/supabase-proxy.php?path=auth`

You should get a JSON error like `"Path is required"` is wrong... actually path=auth might hit the function. Empty path returns Path is required.

`https://your-domain.com/supabase-proxy.php` → `{"error":"Path is required"}` means PHP is working.

Then open `https://your-domain.com` and log in.

`npm run dev` is only for local work. You do not run `dist/` with `npm run dev`.

---

## Chrome extension

1. chrome://extensions → Developer mode → Load unpacked → `extension/` folder
2. Log in on the website, then clock in
3. Screenshots run every 15 minutes while clocked in. Clock out stops them

---

## Emails

Emails are sent by the `notifications` Edge Function via [Resend](https://resend.com).

1. Create an API key in Resend.
2. For production, verify your domain (e.g. `careerjumpstart.com.au`) and use that From address. Until then, Resend only delivers to the email you signed up with.

```powershell
npx supabase secrets set RESEND_API_KEY=re_your_key
npx supabase secrets set RESEND_FROM="LC Monitor <leo.a@example.org>"
npx supabase functions deploy notifications
npx supabase functions deploy admin
npx supabase functions deploy work-sessions
```

Then open Admin → Email and send a test.

| Event | Recipients |
|---|---|
| New user created | That user (login details) |
| Leave submitted | Team manager + Admin/HR |
| Leave approved/rejected | Employee |
| Still clocked in | Open sessions that day (schedule in Supabase → Edge Functions → notifications → Add schedule, body `{"type":"missed-clock-out"}`, cron `0 14 * * 1-5` = 7:30pm IST weekdays) |
| Yesterday's hours | People who worked yesterday (schedule body `{"type":"daily-summary"}`, cron `30 3 * * *` = 9:00am IST) |

Scheduled jobs must send header `x-cron-secret` matching a secret:

```powershell
npx supabase secrets set CRON_SECRET=a-long-random-string
```

Or invoke with the service role key as `Authorization: Bearer`.

---

## If it breaks

| Problem | Fix |
|---------|-----|
| Cannot log in | `JWT_SECRET` not set, or functions not deployed |
| Production API fails | Upload `supabase-proxy.php` with the site |
| No screenshots | Load the extension, clock in on the website, keep Chrome open |
| Screenshot upload error | Create the `screenshots` storage bucket |
