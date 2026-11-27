# 04 — Production Deployment

Public hosting for the dapp. The **smart contract is already live on Sepolia** and is the
source of truth; this deploys the web app + its indexed read-copy.

## Stack

| Piece | Service (free tier) | Notes |
|-------|--------------------|-------|
| Frontend + API (`app/`) | **Vercel** | Next.js 14, auto-detected |
| Database | **Neon** Postgres | Pooled URL for the app, direct URL for migrations |
| Indexer trigger | **GitHub Actions** cron (every 5 min) | Pings `/api/cron/index`; repo is public so Actions minutes are free |
| Indexer backstop | **Vercel cron** (daily) | `app/vercel.json`; Hobby crons run at most once/day |

The indexer route is **stateless**: each run re-scans the most recent `CRON_LOOKBACK` blocks
in 10-block pages and upserts events on `(txHash, logIndex)`, so overlapping runs are
idempotent and no cursor state is stored.

---

## 1. Database — Neon

1. Create a project at **https://neon.tech** → copy two connection strings from the dashboard:
   - **Pooled** (has `-pooler` in the host) → this is `DATABASE_URL`. Append `?pgbouncer=true&connection_limit=1`.
   - **Direct** (no `-pooler`) → this is `DIRECT_URL`.
2. Keep both handy for the Vercel env vars below.

## 2. App — Vercel

1. At **https://vercel.com** → **Add New → Project** → import this GitHub repo.
2. **Root Directory → `app`** (this is a monorepo; the Next.js app lives in `app/`). This is a
   Vercel UI setting, not a file.
3. Add **Environment Variables** (Production + Preview) — set these **before the first deploy**
   because `NEXT_PUBLIC_*` values bake in at build time:

   | Name | Value |
   |------|-------|
   | `DATABASE_URL` | Neon **pooled** url (`...&pgbouncer=true&connection_limit=1`) |
   | `DIRECT_URL` | Neon **direct** url |
   | `SEPOLIA_RPC_URL` | your Alchemy/Infura Sepolia https url |
   | `NEXT_PUBLIC_CONTRACT_ADDRESS` | `0x1814bd123576A928b1642D5f56e3329A12789825` |
   | `NEXT_PUBLIC_CHAIN_ID` | `11155111` |
   | `CRON_SECRET` | a random string you generate |

4. Deploy. Note the resulting URL, e.g. `https://your-app.vercel.app`.
   - `postinstall` runs `prisma generate` automatically on Vercel's build.
   - Changing `NEXT_PUBLIC_CONTRACT_ADDRESS` later requires a **redeploy**, not just an env edit.

## 3. Run migrations (one time, and after any schema change)

From a machine with the repo and the Neon **direct** url:

```bash
cd app
DATABASE_URL="<neon-direct-url>" DIRECT_URL="<neon-direct-url>" npx prisma migrate deploy
```

(Migrations use the direct connection; the pooled URL is only for the running app.)

## 4. Seed the demo campaigns

The indexer writes transaction/contribution rows, but the **Explore page renders Campaign
rows**, so a fresh DB needs seeding once or Explore is blank:

```bash
cd app
BASE_URL="https://your-app.vercel.app" node scripts/seed-campaigns.mjs
```

Idempotent — it skips any `chainId` already present.

## 5. Keep the index fresh — GitHub Actions

The workflow `.github/workflows/indexer-cron.yml` runs every 5 minutes. In the GitHub repo:

**Settings → Secrets and variables → Actions → New repository secret**, add:

| Secret | Value |
|--------|-------|
| `APP_BASE_URL` | `https://your-app.vercel.app` |
| `CRON_SECRET` | the **same** value set in Vercel |

Then **Actions → Index Sepolia events → Run workflow** once to confirm it returns `200`.
(The Vercel daily cron in `app/vercel.json` is a backstop; Vercel auto-sends the
`Authorization: Bearer <CRON_SECRET>` header when `CRON_SECRET` is set in project env.)

## 6. Manual backfill (optional)

If the app was down longer than the lookback window, backfill with the standalone indexer:

```bash
cd app
SEPOLIA_RPC_URL=... NEXT_PUBLIC_CONTRACT_ADDRESS=... DATABASE_URL="<neon-direct-url>" \
  INDEXER_START_BLOCK=<deploy-block> node scripts/indexer.mjs
```

---

## Security notes

- **Never commit** real connection strings or RPC keys — only `.env.example` placeholders.
  Production values live in Vercel/GitHub secrets.
- The Alchemy Sepolia key used during the live test was entered in a chat session; rotating it
  in the Alchemy dashboard afterward is a one-click cleanup (testnet key, low stakes — your call).
- `CRON_SECRET` is the only thing protecting the indexer route from being triggered by anyone;
  use a long random value and keep Vercel + GitHub in sync.
