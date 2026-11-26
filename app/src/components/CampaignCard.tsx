import Link from "next/link";
import { weiToEth, pct } from "@lib/format";

export type CampaignSummary = {
  id: string;
  chainId: number;
  title: string;
  description: string;
  imageUrl?: string | null;
  goalWei: string;
  totalRaisedWei: string;
  status: string;
};

export function CampaignCard({ c }: { c: CampaignSummary }) {
  const progress = pct(c.totalRaisedWei, c.goalWei);
  return (
    <Link
      href={`/campaigns/${c.chainId}`}
      className="block rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md"
    >
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-semibold">{c.title}</h3>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs capitalize">{c.status}</span>
      </div>
      <p className="mb-3 line-clamp-2 text-sm text-gray-600">{c.description}</p>
      <div className="mb-1 h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div className="h-full bg-brand" style={{ width: `${progress}%` }} />
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>{weiToEth(c.totalRaisedWei)} ETH raised</span>
        <span>of {weiToEth(c.goalWei)} ETH</span>
      </div>
    </Link>
  );
}
