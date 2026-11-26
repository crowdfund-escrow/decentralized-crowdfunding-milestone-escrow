"use client";
import { useEffect, useState } from "react";
import { CampaignCard, type CampaignSummary } from "@/components/CampaignCard";

export default function Explore() {
  const [items, setItems] = useState<CampaignSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch("/api/campaigns")
      .then((r) => r.json())
      .then((d) => setItems(d.data ?? []))
      .catch((e) => setErr(String(e)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Explore campaigns</h1>
      {loading && <p className="text-gray-500">Loading...</p>}
      {err && <p className="text-red-600">Could not load campaigns: {err}</p>}
      {!loading && !err && items.length === 0 && (
        <p className="text-gray-500">No campaigns yet. Be the first to create one.</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((c) => (
          <CampaignCard key={c.id} c={c} />
        ))}
      </div>
    </div>
  );
}
