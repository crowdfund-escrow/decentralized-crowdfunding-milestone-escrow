// Seeds the off-chain Campaign rows for the live Sepolia demo campaigns (chainIds 0-2).
// The indexer only writes Transaction/Contribution rows; Campaign rows are what the
// Explore page renders, so a fresh (e.g. production) database needs this once or the
// Explore page is blank. Idempotent: a campaign whose chainId already exists is skipped.
//
// Usage:
//   BASE_URL=https://your-app.vercel.app node scripts/seed-campaigns.mjs
//   (defaults to http://localhost:3000 when BASE_URL is unset)
//
// Values mirror the real on-chain state created during the live test on Sepolia.

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

const CAMPAIGNS = [
  {
    chainId: 0,
    creatorWallet: "0x7B0e4Aa15530FC13981fDaae20b1b160E0211500",
    title: "Demo: Clean Water Borehole",
    description: "Seeded from the live Sepolia contract (campaign 0) to demo the full stack.",
    goalWei: "1000000000000000",
    deadline: "2026-11-27T23:00:03.992Z",
    txHash: "0xdc25c3a483ecb50b85831621342597af56e4d8fe454be6f48ec837e093aa71da",
    milestones: [{ index: 0, description: "Drill and case the borehole", allocationBps: 10000 }],
  },
  {
    chainId: 1,
    creatorWallet: "0x7B0e4Aa15530FC13981fDaae20b1b160E0211500",
    title: "Live Demo: Refund Path (under-funded)",
    description:
      "Sepolia demo campaign intentionally left below goal; contributor reclaimed funds via claimRefund after the deadline.",
    goalWei: "500000000000000000",
    deadline: "2026-11-27T00:57:48.000Z",
    txHash: "0x4d1ed77f55366fe28808297d59bcc2246ccba2249432d38c47909af74118e952",
    milestones: [{ index: 0, description: "Delivery milestone", allocationBps: 10000 }],
  },
  {
    chainId: 2,
    creatorWallet: "0x7B0e4Aa15530FC13981fDaae20b1b160E0211500",
    title: "Live Demo: Milestone Release (fully funded)",
    description:
      "Sepolia demo campaign funded to goal; milestone approved by contribution-weighted vote and escrow released to creator.",
    goalWei: "2000000000000000",
    deadline: "2026-12-04T00:57:00.000Z",
    txHash: "0x114a9831291c04a32a2af2b37439b110f53ddae7b27d0a4079fb978732d4af98",
    milestones: [{ index: 0, description: "Delivery milestone", allocationBps: 10000 }],
  },
];

async function existingChainIds() {
  try {
    const res = await fetch(`${BASE_URL}/api/campaigns`);
    const body = await res.json();
    return new Set((body.data ?? []).map((c) => c.chainId));
  } catch {
    return new Set();
  }
}

async function main() {
  console.log(`Seeding campaigns against ${BASE_URL} ...`);
  const have = await existingChainIds();

  for (const c of CAMPAIGNS) {
    if (have.has(c.chainId)) {
      console.log(`  chainId ${c.chainId}: already present, skipping`);
      continue;
    }
    const res = await fetch(`${BASE_URL}/api/campaigns`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(c),
    });
    const body = await res.json().catch(() => ({}));
    if (res.ok && body.data) {
      console.log(`  chainId ${c.chainId}: created (${body.data.title})`);
    } else {
      console.error(`  chainId ${c.chainId}: FAILED (${res.status}) ${body.error ?? ""}`);
    }
  }
  console.log("Done.");
}

main();
