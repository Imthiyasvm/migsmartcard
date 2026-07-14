# Fix Vercel 404 on MigSmartCard

## Most common cause: wrong Root Directory

Your GitHub repo root should contain `package.json` and `src/`.

### Check in Vercel

1. Open project → **Settings** → **General**
2. **Root Directory**
   - Must be **empty** / `.` if the repo is only `migsmartcard`
   - Must **NOT** be `migsmartcard` unless the GitHub repo has a parent folder that contains a `migsmartcard` subfolder
3. **Framework Preset:** `Next.js` (not Other / Vite)
4. **Build Command:** `next build` or leave default
5. **Output Directory:** **leave empty** (do NOT set `out` or `.next`)
6. **Install Command:** `npm install` (default)
7. **Node.js Version:** 18.x or 20.x

Then: **Deployments** → latest → **⋯** → **Redeploy** (uncheck “Use existing Build Cache”).

---

## Confirm the build actually succeeded

1. Vercel → **Deployments**
2. Open the latest deployment
3. Open **Building** logs

You should see something like:

```text
✓ Compiled successfully
Route (app)
┌ ○ /
┌ ○ /login
...
```

If the build **failed**, the preview can show a generic 404. Fix the error in the log first.

---

## Correct URLs to open

Use the **Vercel deployment URL**, for example:

```text
https://migsmartcard-xxxx.vercel.app/
https://migsmartcard-xxxx.vercel.app/login
https://migsmartcard-xxxx.vercel.app/p/alex-rivera
```

Not:

- GitHub Pages URL  
- `https://github.com/...`  
- A path like `/src/app/...`

---

## Environment variables (needed for login, not for home page)

Project → **Settings** → **Environment Variables**:

| Name | Value |
|------|--------|
| `NEXTAUTH_URL` | your full Vercel URL, e.g. `https://migsmartcard-xxxx.vercel.app` |
| `NEXTAUTH_SECRET` | random string from `openssl rand -base64 32` |

Apply to **Production** and **Preview**, then **Redeploy**.

Missing env vars usually break **login**, not the homepage. Homepage 404 is almost always Root Directory / failed build.

---

## Re-import checklist (if still broken)

1. Delete the Vercel project (or create a new one)
2. [vercel.com/new](https://vercel.com/new) → import `Imthiyasvm/migsmartcard`
3. Leave Root Directory blank
4. Framework: Next.js
5. Add env vars
6. Deploy

---

## Push latest fixes from Mac (optional)

If you update files locally:

```bash
cd ~/migsmartcard
git add .
git commit -m "Fix Vercel config for 404"
git push origin main
```

Vercel will auto-redeploy from GitHub.
