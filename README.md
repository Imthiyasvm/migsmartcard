# MigSmartCard — Smarter Way to Connect

A complete **Digital Smart Business Card Platform** with NFC, QR codes, analytics, lead capture, team management, admin panel, and e-commerce for physical cards.

## Tech Stack

- **Frontend:** Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Auth:** NextAuth.js (JWT + credentials)
- **UI:** Radix UI primitives, Lucide icons, Recharts
- **Data:** JSON file store (demo-ready; swap for PostgreSQL in production)
- **QR:** `qrcode` library (PNG/SVG)

## Quick Start

```bash
cd migsmartcard
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Pro User | `demo@migsmartcard.com` | `password123` |
| Platform Admin | `admin@migsmartcard.com` | `password123` |
| Company Admin | `ceo@acme.com` | `password123` |
| Team Member | `sam@acme.com` | `password123` |

Demo public card: [/p/alex-rivera](http://localhost:3000/p/alex-rivera)

## Features

### User
- Digital profile editor (bio, contact, socials, custom links, themes)
- Public shareable profile `/p/[slug]`
- Dynamic QR (PNG/SVG download)
- NFC card linking (`/api/nfc/[uid]` → profile)
- vCard contact download
- Lead capture / contact exchange
- Analytics (views, devices, locations, link clicks, NFC/QR)
- Email signature generator
- NFC card shop & order tracking
- Billing plans (Free / Pro / Business / Enterprise)
- Dark / light mode

### Team (Business+)
- Company account
- Add employees with auto-created profiles
- Centralized team dashboard

### Admin
- Platform stats & MRR
- User management (plan, status, delete)
- NFC inventory & assignment
- Order fulfillment

### Legal
- Privacy Policy, Terms, Cookie Policy (GDPR-oriented)

## Project Structure

```
src/
  app/
    (marketing)/     # Landing, login, register, shop, legal
    dashboard/       # User dashboard pages
    admin/           # Admin panel
    p/[slug]/        # Public digital cards
    api/             # REST APIs
  components/        # UI + layout
  lib/               # db, auth, plans, utils
  types/             # TypeScript types
data/                # JSON persistence (auto-seeded)
```

## Deploy to Vercel

Full guide: **[DEPLOY_VERCEL.md](./DEPLOY_VERCEL.md)**

### Fast path

1. Push this folder to GitHub  
2. Import the repo at [vercel.com/new](https://vercel.com/new)  
3. Set environment variables:

| Variable | Example |
|----------|---------|
| `NEXTAUTH_URL` | `https://your-app.vercel.app` |
| `NEXTAUTH_SECRET` | output of `openssl rand -base64 32` |

4. Deploy  

On Vercel the app uses an **in-memory demo database** (auto-seeded). Locally it still uses the `data/` folder. For real production data, swap `src/lib/db.ts` for Postgres (Supabase/Neon).

```bash
# Or deploy with CLI
npm i -g vercel
vercel login
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL
vercel --prod
```

## Production Notes

- Replace in-memory / JSON store with PostgreSQL (Prisma or Drizzle)
- Configure real Stripe / Razorpay / PayPal in `api/billing`
- Set strong `NEXTAUTH_SECRET` and correct `NEXTAUTH_URL`
- Use S3/Cloudinary for profile image uploads
- Deploy on Vercel (demo), or AWS / DigitalOcean for long-lived storage
- Enable SSL, daily backups, and multi-region if needed

## Scripts

```bash
npm run dev      # Development
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint
```

## License

Proprietary — MigSmartCard © 2026
