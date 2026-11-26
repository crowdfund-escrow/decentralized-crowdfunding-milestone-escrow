"use client";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ethers } from "ethers";
import { connectWallet, ensureSepolia } from "@lib/web3";
import { getReadContract, getWriteContract } from "@lib/contract";
import { weiToEth, ethToWei, shortAddr, pct } from "@lib/format";

type Meta = {
  title?: string;
  description?: string;
  imageUrl?: string | null;
  creatorWallet?: string;
  milestones?: { index: number; description: string; allocationBps: number }[];
};

export default function CampaignDetail() {
  const params = useParams();
  const id = Number(params.id);

  const [wallet, setWallet] = useState("");
  const [meta, setMeta] = useState<Meta>({});
  const [chain, setChain] = useState<any>(null);
  const [ms, setMs] = useState<any[]>([]);
  const [mine, setMine] = useState<bigint>(0n);
  const [amount, setAmount] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [configured, setConfigured] = useState(true);

  const loadChain = useCallback(async (who?: string) => {
    try {
      const c = getReadContract();
      const camp = await c.getCampaign(id);
      setChain(camp);
      const count = Number(camp.milestoneCount);
      const list: any[] = [];
      for (let i = 0; i < count; i++) list.push(await c.getMilestone(id, i));
      setMs(list);
      if (who) setMine(await c.getContribution(id, who));
    } catch (e: any) {
      if (String(e?.message).includes("NEXT_PUBLIC_CONTRACT_ADDRESS")) setConfigured(false);
    }
  }, [id]);

  useEffect(() => {
    fetch(`/api/campaigns/${id}`).then((r) => (r.ok ? r.json() : null)).then((d) => d && setMeta(d.data ?? {})).catch(() => {});
    loadChain();
  }, [id, loadChain]);

  async function connect() {
    const w = await connectWallet();
    setWallet(w);
    loadChain(w);
  }

  async function run(fn: (c: ethers.Contract) => Promise<any>, pending: string) {
    setMsg(pending);
    setBusy(true);
    try {
      await connectWallet();
      await ensureSepolia();
      const c = await getWriteContract();
      const tx = await fn(c);
      await tx.wait();
      setMsg("Done.");
      await loadChain(wallet);
    } catch (e: any) {
      setMsg(e?.shortMessage ?? e?.message ?? "Transaction failed");
    } finally {
      setBusy(false);
    }
  }

  const isCreator = wallet && chain && wallet.toLowerCase() === String(chain.creator).toLowerCase();
  const progress = chain ? pct(chain.totalRaised.toString(), chain.goal.toString()) : 0;

  return (
    <div className="space-y-6">
      {!configured && (
        <p className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
          Contract address not set. Add NEXT_PUBLIC_CONTRACT_ADDRESS to .env after deployment.
        </p>
      )}

      <div>
        <h1 className="text-2xl font-bold">{meta.title ?? `Campaign #${id}`}</h1>
        {chain && <p className="text-sm text-gray-500">Creator: {shortAddr(chain.creator)}</p>}
      </div>

      {meta.description && <p className="text-gray-700">{meta.description}</p>}

      {chain && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div className="h-full bg-brand" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>{weiToEth(chain.totalRaised.toString())} ETH raised</span>
            <span>Goal {weiToEth(chain.goal.toString())} ETH</span>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Deadline: {new Date(Number(chain.deadline) * 1000).toLocaleString()}
          </p>

          <div className="mt-4 flex gap-2">
            <input className="w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm" type="number" step="0.0001" placeholder="ETH" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <button disabled={busy} onClick={() => run((c) => c.contribute(id, { value: ethToWei(amount) }), "Contributing...")} className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50">
              Contribute
            </button>
            <button disabled={busy} onClick={() => run((c) => c.claimRefund(id), "Claiming refund...")} className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">
              Claim refund
            </button>
          </div>
          {!wallet && (
            <button onClick={connect} className="mt-3 text-sm text-brand">Connect wallet to interact</button>
          )}
          {wallet && mine > 0n && (
            <p className="mt-2 text-xs text-gray-500">Your contribution: {weiToEth(mine.toString())} ETH</p>
          )}
        </div>
      )}

      <section>
        <h2 className="mb-3 font-semibold">Milestones</h2>
        <div className="space-y-3">
          {ms.map((m, i) => {
            const desc = meta.milestones?.find((x) => x.index === i)?.description ?? `Milestone ${i + 1}`;
            const released = m.released;
            const approved = chain && m.weightVoted > 0n;
            return (
              <div key={i} className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{desc}</h3>
                  <span className="text-xs text-gray-500">{Number(m.allocationBps) / 100}%</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {released ? "Released" : m.submittedAt > 0n ? "In voting" : "Pending"} - votes for {weiToEth(m.votesFor.toString())} / against {weiToEth(m.votesAgainst.toString())} ETH
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {isCreator && m.submittedAt === 0n && (
                    <button disabled={busy} onClick={() => run((c) => c.submitMilestone(id, i, ethers.id(`evidence-${id}-${i}`)), "Submitting evidence...")} className="rounded border px-3 py-1 text-xs hover:bg-gray-50">
                      Submit evidence
                    </button>
                  )}
                  {!isCreator && m.submittedAt > 0n && !released && (
                    <>
                      <button disabled={busy} onClick={() => run((c) => c.voteOnMilestone(id, i, true), "Voting...")} className="rounded border px-3 py-1 text-xs hover:bg-gray-50">
                        Vote approve
                      </button>
                      <button disabled={busy} onClick={() => run((c) => c.voteOnMilestone(id, i, false), "Voting...")} className="rounded border px-3 py-1 text-xs hover:bg-gray-50">
                        Vote reject
                      </button>
                    </>
                  )}
                  {m.submittedAt > 0n && !released && (
                    <button disabled={busy} onClick={() => run((c) => c.releaseMilestoneFunds(id, i), "Releasing...")} className="rounded border px-3 py-1 text-xs hover:bg-gray-50">
                      Release if approved
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {msg && <p className="text-sm text-gray-600">{msg}</p>}
    </div>
  );
}
