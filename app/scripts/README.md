# Backend scripts

## indexer.mjs

Polls confirmed Sepolia blocks for CrowdfundingEscrow events and writes them to PostgreSQL,
deduping on `(txHash, logIndex)`. The blockchain stays authoritative; the DB is a searchable copy.

```bash
# from app/, with .env set (SEPOLIA_RPC_URL, NEXT_PUBLIC_CONTRACT_ADDRESS, DATABASE_URL)
node scripts/indexer.mjs
```

Optional env: `INDEXER_START_BLOCK` (deployment block), `INDEXER_POLL_MS` (default 15000).
Run it as a long-lived process alongside the web app.
