# WarehouseOS — Setup Guide

## 1. Create a free cloud database (Neon)

1. Go to **neon.tech** and sign up for free
2. Create a new project (e.g. "warehouseos")
3. Copy the **connection string** — it looks like:
   `postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require`
4. Open `.env` and paste it as `DATABASE_URL`

## 2. Generate a secure secret

Run this command and paste the output as `NEXTAUTH_SECRET` in `.env`:
```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 3. Run database migration

```bash
npx prisma migrate dev --name init
```

## 4. Seed the database (creates first CEO account)

```bash
npm run db:seed
```

This creates:
- Warehouse: **Main Warehouse**
- CEO login: **admin** / **admin123**  ← Change this after first login!

## 5. Start the app

```bash
npm run dev
```

Open **http://localhost:3000** in your browser.

## 6. Deploy to Vercel (make it public)

1. Push your code to GitHub
2. Go to **vercel.com** → New Project → Import your repo
3. Add these environment variables in Vercel settings:
   - `DATABASE_URL` — your Neon connection string
   - `NEXTAUTH_SECRET` — your secret from step 2
   - `NEXTAUTH_URL` — your Vercel app URL (e.g. https://warehouseos.vercel.app)
4. Deploy!

---

## Default credentials after seed

| Role | Username | Password |
|------|----------|----------|
| CEO | admin | admin123 |

**Change the admin password immediately after first login.**

## User roles explained

- **Worker** — creates supply requests → sent to team manager
- **Team Manager** — reviews team requests + sends combined order to warehouse
- **Warehouse Worker** — fulfills orders, tracks returns
- **Warehouse Manager** — above + manages inventory + can blacklist teams
- **Regional Manager** — above + approves manager signup requests + manages all users
- **CEO** — full access + creates warehouses + assigns regional managers
