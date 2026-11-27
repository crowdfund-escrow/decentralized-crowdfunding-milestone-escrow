import { NextResponse } from "next/server";
import { ethers } from "ethers";
import { prisma } from "@lib/prisma";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@lib/contract";

export const dynamic = "force-dynamic";
// Serverless function budget. Hobby tier may cap this lower (verify in Vercel docs);
// keep CRON_LOOKBACK small enough that a run finishes inside the cap.
export const maxDuration = 60;

// Stateless lookback indexer. Each invocation re-scans the most recent blocks and
// upserts events keyed on (txHash, logIndex), so overlapping re-scans are idempotent
// and no cursor/last-block state is required. Triggered on a schedule (GitHub Actions
// cron or Vercel cron) with an Authorization: Bearer <CRON_SECRET> header.
const LOG_RANGE = Number(process.env.INDEXER_LOG_RANGE ?? 10); // free-tier getLogs cap
const LOOKBACK = Number(process.env.CRON_LOOKBACK ?? 300); // blocks to re-scan per run

async function handle(
  log: ethers.Log,
  iface: ethers.Interface
): Promise<string | null> {
  let parsed: ethers.LogDescription | null;
  try {
    parsed = iface.parseLog({ topics: [...log.topics], data: log.data });
  } catch {
    return null;
  }
  if (!parsed) return null;

  const campaign = await prisma.campaign.findUnique({
    where: { chainId: Number(parsed.args.campaignId) },
  });
  const campaignId = campaign?.id ?? null;
  const base = {
    campaignId,
    txHash: log.transactionHash,
    logIndex: log.index,
    eventType: parsed.name,
  };

  if (parsed.name === "ContributionReceived") {
    await prisma.transaction.upsert({
      where: { txHash_logIndex: { txHash: log.transactionHash, logIndex: log.index } },
      update: {},
      create: { ...base, wallet: parsed.args.contributor, amountWei: parsed.args.amount.toString() },
    });
    if (campaignId) {
      await prisma.contribution
        .create({
          data: {
            campaignId,
            wallet: parsed.args.contributor,
            amountWei: parsed.args.amount.toString(),
            txHash: log.transactionHash,
          },
        })
        .catch(() => {});
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
  return parsed.name;
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ data: null, error: "unauthorized" }, { status: 401 });
  }

  const RPC = process.env.SEPOLIA_RPC_URL;
  if (!RPC || !CONTRACT_ADDRESS) {
    return NextResponse.json(
      { data: null, error: "SEPOLIA_RPC_URL and NEXT_PUBLIC_CONTRACT_ADDRESS must be set" },
      { status: 500 }
    );
  }

  try {
    const provider = new ethers.JsonRpcProvider(RPC);
    const iface = new ethers.Interface(CONTRACT_ABI);
    const head = await provider.getBlockNumber();
    const from = Math.max(0, head - LOOKBACK);

    const events: Record<string, number> = {};
    for (let start = from; start <= head; start += LOG_RANGE) {
      const end = Math.min(start + LOG_RANGE - 1, head);
      const logs = await provider.getLogs({ address: CONTRACT_ADDRESS, fromBlock: start, toBlock: end });
      for (const log of logs) {
        const name = await handle(log, iface);
        if (name) events[name] = (events[name] ?? 0) + 1;
      }
    }

    return NextResponse.json({ data: { scannedFrom: from, head, events }, error: null });
  } catch (e: any) {
    return NextResponse.json({ data: null, error: e.message }, { status: 500 });
  }
}
