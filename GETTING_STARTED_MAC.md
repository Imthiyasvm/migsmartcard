# Run MigSmartCard on your Mac

The project was built in Arena.ai's cloud workspace — it is **not** already on your Mac.
Download the zip, then follow these steps.

## 1. Download & unzip

1. Download `migsmartcard-project.zip` from the Arena workspace files
2. Double-click to unzip (or run the commands below)

```bash
cd ~/Downloads
unzip migsmartcard-project.zip -d ~/migsmartcard
cd ~/migsmartcard
```

If the zip extracts into a nested folder, `cd` into the folder that contains `package.json`:

```bash
ls package.json   # must succeed
```

## 2. Requirements

- **Node.js 18 or 20** (recommended)

```bash
node -v   # should print v18.x or v20.x
```

If Node is missing, install via Homebrew:

```bash
brew install node@20
```

Or download from https://nodejs.org

## 3. Install & run

```bash
cd ~/migsmartcard
npm install
cp .env.example .env.local
npm run dev
```

Open: **http://localhost:3000**

## 4. Demo logins

Password for all: `password123`

| Role | Email |
|------|--------|
| Pro user | demo@migsmartcard.com |
| Admin | admin@migsmartcard.com |
| Company | ceo@acme.com |

Demo card: http://localhost:3000/p/alex-rivera

## Common mistakes

| What you did | Problem |
|--------------|---------|
| `cd migsmartcard` from `~` without downloading | Folder doesn't exist on Mac |
| `npm install` from home directory | No package.json in `/Users/imthiyas` |
| Running from wrong folder after unzip | Nested directory — find `package.json` first |

## Deploy to Vercel

See `DEPLOY_VERCEL.md` after the app runs locally.
