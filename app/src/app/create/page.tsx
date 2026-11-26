"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ensureSepolia, connectWallet } from "@lib/web3";
import { getWriteContract, metaHash } from "@lib/contract";
import { ethToWei } from "@lib/format";
import { ethers } from "ethers";

type MilestoneInput = { description: string; percent: string };

export default function CreateCampaign() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [goal, setGoal] = useState("");
  const [deadline, setDeadline] = useState("");
  const [milestones, setMilestones] = useState<MilestoneInput[]>([
    { description: "", percent: "" },
  ]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  function setM(i: number, key: keyof MilestoneInput, v: string) {
    setMilestones((ms) => ms.map((m, j) => (j === i ? { ...m, [key]: v } : m)));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const totalPct = milestones.reduce((s, m) => s + Number(m.percent || 0), 0);
    if (totalPct !== 100) {
      setMsg("Milestone percentages must add up to exactly 100%.");
      return;
    }
    setBusy(true);
    try {
      await connectWallet();
      await ensureSepolia();
      const contract = await getWriteContract();

      const allocationsBps = milestones.map((m) => Math.round(Number(m.percent) * 100));
      const milestoneHashes = milestones.map((m) => ethers.id(m.description));
      const deadlineUnix = Math.floor(new Date(deadline).getTime() / 1000);
      const hash = metaHash({ title, description, imageUrl });

      const tx = await contract.createCampaign(
        hash,
        ethToWei(goal),
        deadlineUnix,
        allocationsBps,
        milestoneHashes
      );
      setMsg("Waiting for confirmation...");
      const receipt = await tx.wait();

      let chainId: number | undefined;
      for (const log of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog(log);
          if (parsed?.name === "CampaignCreated") {
            chainId = Number(parsed.args.campaignId);
            break;
          }
        } catch {
          /* not our event */
        }
      }
      if (chainId === undefined) throw new Error("Could not read campaign id from receipt");

      const signer = await contract.runner;
      const creatorWallet = (signer as any)?.address ?? "";

      await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chainId,
          creatorWallet,
          title,
          description,
          imageUrl,
          goalWei: ethToWei(goal).toString(),
          deadline: new Date(deadline).toISOString(),
          txHash: receipt.hash,
          milestones: milestones.map((m, i) => ({
            index: i,
            description: m.description,
            allocationBps: Math.round(Number(m.percent) * 100),
          })),
        }),
      });

      router.push(`/campaigns/${chainId}`);
    } catch (err: any) {
      setMsg(err?.shortMessage ?? err?.message ?? "Transaction failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-5">
      <h1 className="text-2xl font-bold">Create a campaign</h1>

      <Field label="Title">
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </Field>
      <Field label="Description">
        <textarea className="input" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} required />
      </Field>
      <Field label="Image URL (optional)">
        <input className="input" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Target (ETH)">
          <input className="input" type="number" step="0.0001" value={goal} onChange={(e) => setGoal(e.target.value)} required />
        </Field>
        <Field label="Deadline">
          <input className="input" type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} required />
        </Field>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="font-medium">Milestones (must total 100%)</label>
          <button type="button" className="text-sm text-brand" onClick={() => setMilestones((m) => [...m, { description: "", percent: "" }])}>
            + Add milestone
          </button>
        </div>
        <div className="space-y-2">
          {milestones.map((m, i) => (
            <div key={i} className="flex gap-2">
              <input className="input flex-1" placeholder={`Milestone ${i + 1} description`} value={m.description} onChange={(e) => setM(i, "description", e.target.value)} required />
              <input className="input w-24" type="number" placeholder="%" value={m.percent} onChange={(e) => setM(i, "percent", e.target.value)} required />
            </div>
          ))}
        </div>
      </div>

      {msg && <p className="text-sm text-red-600">{msg}</p>}
      <button disabled={busy} className="rounded-lg bg-brand px-5 py-2.5 font-medium text-white hover:bg-brand-dark disabled:opacity-50">
        {busy ? "Submitting..." : "Create campaign"}
      </button>

      <style jsx>{`
        .input {
          width: 100%;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
        }
      `}</style>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}
