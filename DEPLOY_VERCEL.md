# Deploy MigSmartCard to Vercel

Next.js deploys natively on Vercel. Follow either path below.

---

## Option A — Deploy from GitHub (recommended)

### 1. Push the project to GitHub

```bash
cd migsmartcard
git init
git add .
git commit -m "Initial MigSmartCard platform"
# Create a new empty repo on GitHub, then:
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/migsmartcard.git
git push -u origin main
```

### 2. Import in Vercel

1. Go to [https://vercel.com/new](https://vercel.com/new)
2. Sign in with GitHub
3. Click **Import** on your `migsmartcard` repo
4. Framework preset should show **Next.js** (auto-detected)
5. Root directory: leave as `.` (or the folder that contains `package.json`)
6. **Do not deploy yet** — add env vars first (next step)

### 3. Environment variables

In the import screen → **Environment Variables**, add:

| Name | Value | Environments |
|------|--------|--------------|
| `NEXTAUTH_URL` | `https://your-project.vercel.app` | Production, Preview |
| `NEXTAUTH_SECRET` | long random string (see below) | Production, Preview, Development |

Generate a secret:

```bash
openssl rand -base64 32
```

> After the first deploy, if Vercel assigns a different URL than you guessed, update `NEXTAUTH_URL` to the real production URL and **redeploy**.

### 4. Deploy

Click **Deploy**. Wait for the build to finish (~1–2 minutes).

Your site will be live at:

```
https://migsmartcard-xxxx.vercel.app
```

### 5. Test

| URL | What to check |
|-----|----------------|
| `/` | Landing page |
| `/p/alex-rivera` | Demo digital card |
| `/login` | Sign in with demo accounts |
| `/dashboard` | After login |

**Demo accounts** (password for all: `password123`):

- `demo@migsmartcard.com` — Pro user  
- `admin@migsmartcard.com` — Platform admin  
- `ceo@acme.com` — Company admin  

---

## Option B — Deploy with Vercel CLI

```bash
cd migsmartcard
npm i -g vercel

# Login (opens browser)
vercel login

# First deploy (preview)
vercel

# When prompted:
# - Set up and deploy? Y
# - Which scope? your account
# - Link to existing project? N
# - Project name? migsmartcard
# - Directory? ./
# - Override settings? N

# Add env vars
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL

# Production deploy
vercel --prod
```

Set `NEXTAUTH_URL` to the production URL printed by Vercel, e.g. `https://migsmartcard.vercel.app`.

---

## Custom domain

1. Vercel project → **Settings** → **Domains**
2. Add `cards.yourdomain.com` or `yourdomain.com`
3. Add the DNS records Vercel shows (usually a CNAME or A record)
4. Update env:

```
NEXTAUTH_URL=https://cards.yourdomain.com
```

5. Redeploy (**Deployments** → ⋮ → Redeploy) so auth uses the new URL

---

## Important: data storage on Vercel

This demo uses an **in-memory database** on Vercel (auto-detected via `VERCEL=1`):

| Works | Limitation |
|-------|------------|
| Browse site, demo logins, public cards | Data resets on cold starts |
| Analytics/leads during a session | Not shared across all serverless instances |
| Full UI / admin demo | Not for real multi-user production data |

Locally (`npm run dev`) data still saves to the `data/` folder.

### For real production on Vercel

Replace `src/lib/db.ts` with a real database:

1. **Supabase** or **Neon** (Postgres) + Prisma/Drizzle  
2. Or **PlanetScale** / **MongoDB Atlas**  
3. Keep the same `db.*` API so the rest of the app stays unchanged  

Also add:

- **Cloudinary / S3** for profile photos  
- **Stripe** for real billing (hook into `/api/billing`)  

---

## Build settings (defaults are fine)

| Setting | Value |
|---------|--------|
| Framework | Next.js |
| Build command | `next build` (default) |
| Output | Next.js default (not static export) |
| Node.js | 18.x or 20.x |
| Install command | `npm install` |

No special `vercel.json` routes are required. The included `vercel.json` only sets the framework and region.

---

## Troubleshooting

### Login fails / “Configuration” error
- `NEXTAUTH_URL` must match the exact public URL (`https://...`, no trailing slash)
- `NEXTAUTH_SECRET` must be set in Vercel env vars
- After changing env vars → **Redeploy**

### Build fails
- Check build logs in Vercel
- Locally run `npm run build` and fix errors first

### Demo user missing after idle time
- Expected with in-memory DB — cold start re-seeds demo accounts automatically
- Switch to Postgres for permanent data

### 404 on refresh of dynamic routes
- Unlikely with Next.js on Vercel; if it happens, ensure Framework Preset is **Next.js**, not “Other”

### Environment not applied
- Variables must be set for **Production** (and Preview if testing PRs)
- Redeploy after any env change

---

## Quick checklist

- [ ] Code on GitHub  
- [ ] Vercel project imported  
- [ ] `NEXTAUTH_SECRET` set  
- [ ] `NEXTAUTH_URL` = live HTTPS URL  
- [ ] Deploy succeeded  
- [ ] `/p/alex-rivera` loads  
- [ ] Login with `demo@migsmartcard.com` / `password123`  
- [ ] (Optional) Custom domain + update `NEXTAUTH_URL`  

---

## One-liner mental model

```
GitHub push → Vercel builds Next.js → set NEXTAUTH_* → live URL
```

That’s all you need for a public demo of MigSmartCard on Vercel.
