# App — Next.js (frontend + API)

Owners: **FE** (pages, wallet UI) and **BE** (API routes, Prisma, event indexing).
Next.js serves both the website and the backend API, so there is no separate backend folder.

## Initialise the Next.js project (FE, once)

From this `app/` folder:

```bash
npx create-next-app@latest . --ts --tailwind --app --eslint --src-dir --use-npm
npm install ethers @prisma/client
npm install -D prisma
```

Keep the `lib/` and `prisma/` files already in this folder — they are the shared integration
pieces. Then:

```bash
cp ../.env.example .env        # fill DATABASE_URL, SEPOLIA_RPC_URL, NEXT_PUBLIC_CONTRACT_ADDRESS
npx prisma migrate dev --name crowdfunding_init
npx prisma generate
npm run dev
```

## Structure (target)

```
src/app/            pages & routes
  page.tsx          homepage (featured campaigns, totals)
  explore/          campaign listing
  campaigns/[id]/   campaign detail + contribute + milestones
  create/           campaign creation form
  dashboard/        my campaigns / contributions / votes / refunds
  api/              campaign, contribution, transaction, milestone routes
lib/                web3.ts, contract.ts, prisma.ts  (shared — do not fork)
prisma/             schema.prisma
```

## Rules

- The frontend/backend **never decide** blockchain outcomes — read them from the contract and
  verify transaction receipts. The chain is the source of truth; the DB is an indexed copy.
- Store raw **wei as strings** in the DB for exact reconciliation.
- Never expose private keys in the browser. Only `NEXT_PUBLIC_*` vars reach the client.

See [`../docs/02-integration-contract.md`](../docs/02-integration-contract.md) for the API/event spec.
