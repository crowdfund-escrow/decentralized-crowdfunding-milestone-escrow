// Minimal polling indexer: scans confirmed Sepolia blocks for CrowdfundingEscrow events and
// writes them to PostgreSQL. The chain stays authoritative; this is a searchable copy.
// Run with: node scripts/indexer.mjs   (needs SEPOLIA_RPC_URL + NEXT_PUBLIC_CONTRACT_ADDRESS + DATABASE_URL)
// Dedupe key: (txHash, logIndex). Safe to restart; it catches up from the last processed block.

import { ethers } from "ethers";
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const abi = JSON.parse(readFileSync(join(__dirname, "../lib/abi/CrowdfundingEscrow.json"), "utf8"));

const RPC = process.env.SEPOLIA_RPC_URL;
const ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
const START_BLOCK = Number(process.env.INDEXER_START_BLOCK ?? 0);
const POLL_MS = Number(process.env.INDEXER_POLL_MS ?? 15000);
// Max block span per eth_getLogs call. Free-tier providers (e.g. Alchemy free) cap this
// at 10 blocks, so we scan in bounded windows rather than one large range.
const LOG_RANGE = Number(process.env.INDEXER_LOG_RANGE ?? 10);

if (!RPC || !ADDRESS) {
  console.error("Set SEPOLIA_RPC_URL and NEXT_PUBLIC_CONTRACT_ADDRESS");
  process.exit(1);
}

const prisma = new PrismaClient();
const provider = new ethers.JsonRpcProvider(RPC);
const contract = new ethers.Contract(ADDRESS, abi, provider);

async function campaignIdToDbId(chainId) {
  const c = await prisma.campaign.findUnique({ where: { chainId: Number(chainId) } });
  return c?.id ?? null;
}

async function handle(log) {
  let parsed;
  try { parsed = contract.interface.parseLog(log); } catch { return; }
  if (!parsed) return;

  const campaignId = await campaignIdToDbId(parsed.args.campaignId);
  const base = {
    campaignId,
    txHash: log.transactionHash,
    logIndex: log.index,
    eventType: parsed.name,
  };

  try {
    if (parsed.name === "ContributionReceived") {
      await prisma.transaction.upsert({
        where: { txHash_logIndex: { txHash: log.transactionHash, logIndex: log.index } },
        update: {},
        create: { ...base, wallet: parsed.args.contributor, amountWei: parsed.args.amount.toString() },
      });
      if (campaignId) {
        await prisma.contribution.create({
          data: {
            campaignId,
            wallet: parsed.args.contributor,
            amountWei: parsed.args.amount.toString(),
            txHash: log.transactionHash,
          },
        }).catch(() => {});
      }
    } else {
      await prisma.transaction.upsert({
        where: { txHash_logIndex: { txHash: log.transactionHash, logIndex: log.index } },
        update: {},
        create: {
          ...base,
          wallet: parsed.args.contributor ?? parsed.args.voter ?? null,
          amountWei: parsed.args.amount ? parsed.args.amount.toString() : null,
        },
      });
    }
  } catch (e) {
    console.error("write error", e.message);
  }
}

async function main() {
  let from = START_BLOCK;
  console.log(`Indexing ${ADDRESS} from block ${from}...`);
  for (;;) {
    try {
      const head = await provider.getBlockNumber();
      if (head >= from) {
        // Scan in bounded windows so free-tier getLogs range limits are respected.
        for (let start = from; start <= head; start += LOG_RANGE) {
          const end = Math.min(start + LOG_RANGE - 1, head);
          const logs = await provider.getLogs({ address: ADDRESS, fromBlock: start, toBlock: end });
          for (const log of logs) await handle(log);
        }
        from = head + 1;
      }
    } catch (e) {
      console.error("poll error", e.message);
    }
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
}

main();
