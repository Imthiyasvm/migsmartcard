# Fix card preview 404 on smartcard.migbiz.com

## Why it happens

Login/dashboard work. Public cards live at:

```text
https://smartcard.migbiz.com/p/YOUR-SLUG
```

On Vercel, without Redis, each request can hit a **different server** with **empty memory**. Your saved card is not there → **404**.

Demo cards work (`/p/alex-rivera`) because they are re-seeded every cold start.

## Immediate workaround (works today)

While logged in, open:

```text
https://smartcard.migbiz.com/dashboard/preview
```

Or: **Dashboard → Card Preview** / **My Card → Live Preview**

## Permanent fix: Upstash Redis (free, ~5 min)

### 1. Create Redis

1. https://console.upstash.com → sign up  
2. **Create database** (pick a region)  
3. Open the DB → **REST API**  
4. Copy:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

### 2. Add to Vercel

Project → **Settings** → **Environment Variables**

| Name | Value |
|------|--------|
| `NEXTAUTH_URL` | `https://smartcard.migbiz.com` |
| `NEXTAUTH_SECRET` | (keep existing) |
| `UPSTASH_REDIS_REST_URL` | from Upstash |
| `UPSTASH_REDIS_REST_TOKEN` | from Upstash |

Apply to **Production** (and Preview).

### 3. Push latest code + redeploy

Code must include Redis profile save/load (this update).

```bash
cd ~/migsmartcard
# after updating files from the new zip OR git pull
git add .
git commit -m "Fix public card preview with Redis persistence"
git push origin main
```

Then Vercel auto-deploys, or **Deployments → Redeploy** (no cache).

### 4. Verify

Open:

```text
https://smartcard.migbiz.com/api/health
```

You want:

```json
"redisEnabled": true
```

Then:

1. Dashboard → My Card  
2. Public Profile **ON**  
3. **Save Changes**  
4. Open `https://smartcard.migbiz.com/p/your-slug`  

Should load (not 404).

## Checklist

- [ ] Latest code pushed to GitHub  
- [ ] `NEXTAUTH_URL=https://smartcard.migbiz.com`  
- [ ] Upstash URL + token set in Vercel  
- [ ] Redeployed  
- [ ] `/api/health` shows `"redisEnabled": true`  
- [ ] Save card → open `/p/slug` works  
