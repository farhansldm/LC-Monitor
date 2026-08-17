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

```bash
npm run build
```

Upload the `dist/` folder. The host must run PHP so `/supabase-proxy.php` works.

---

## Chrome extension

1. chrome://extensions → Developer mode → Load unpacked → `extension/` folder
2. Log in on the website, then clock in
3. Screenshots run every 15 minutes while clocked in. Clock out stops them

---

## Emails (optional)

The app works without this. Emails (leave, still clocked in, daily hours) only send if you add a [Resend](https://resend.com) API key:

```bash
npx supabase secrets set RESEND_API_KEY=re_...
```

---

## If it breaks

| Problem | Fix |
|---------|-----|
| Cannot log in | `JWT_SECRET` not set, or functions not deployed |
| Production API fails | Upload `supabase-proxy.php` with the site |
| No screenshots | Load the extension, clock in on the website, keep Chrome open |
| Screenshot upload error | Create the `screenshots` storage bucket |
