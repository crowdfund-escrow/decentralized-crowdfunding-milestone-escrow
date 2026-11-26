"use client";
import { useEffect, useState } from "react";
import { connectWallet, hasMetaMask } from "@lib/web3";
import { CampaignCard, type CampaignSummary } from "@/components/CampaignCard";
import { shortAddr, weiToEth } from "@lib/format";

type Contribution = { id: string; campaignId: string; amountWei: string; txHash: string };

export default function Dashboard() {
  const [wallet, setWallet] = useState("");
  const [created, setCreated] = useState<CampaignSummary[]>([]);
  const [contribs, setContribs] = useState<Contribution[]>([]);

  async function connect() {
    const a = await connectWallet();
    setWallet(a);
  }

  useEffect(() => {
    if (!wallet) return;
    fetch("/api/campaigns")
      .then((r) => r.json())
      .then((d) => setCreated((d.data ?? []).filter((c: any) => c.creatorWallet?.toLowerCase() === wallet.toLowerCase())))
      .catch(() => {});
    fetch(`/api/users/${wallet}/contributions`)
      .then((r) => r.json())
      .then((d) => setContribs(d.data ?? []))
      .catch(() => {});
  }, [wallet]);

  if (!hasMetaMask()) return <p>Install MetaMask to view your dashboard.</p>;

  if (!wallet) {
    return (
      <div>
        <h1 className="mb-4 text-2xl font-bold">Your dashboard</h1>
        <button onClick={connect} className="rounded-lg bg-brand px-5 py-2.5 font-medium text-white hover:bg-brand-dark">
          Connect wallet
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Dashboard - {shortAddr(wallet)}</h1>

      <section>
        <h2 className="mb-3 font-semibold">My campaigns</h2>
        {created.length === 0 ? (
          <p className="text-sm text-gray-500">You have not created any campaigns.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {created.map((c) => <CampaignCard key={c.id} c={c} />)}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-semibold">My contributions</h2>
        {contribs.length === 0 ? (
          <p className="text-sm text-gray-500">No contributions yet.</p>
        ) : (
          <ul className="divide-y rounded-xl border border-gray-200 bg-white">
            {contribs.map((c) => (
              <li key={c.id} className="flex justify-between px-4 py-3 text-sm">
                <span>Campaign #{c.campaignId}</span>
                <span className="font-medium">{weiToEth(c.amountWei)} ETH</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
