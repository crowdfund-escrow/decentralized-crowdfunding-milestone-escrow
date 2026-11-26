import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="rounded-2xl bg-white p-10 shadow-sm">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Fund projects. Release by milestone. Refund if it fails.
        </h1>
        <p className="mt-4 max-w-2xl text-gray-600">
          A decentralised crowdfunding platform where contributors keep visibility and voting
          rights over how funds are released. ETH is held in on-chain escrow and only released to
          creators as milestones are approved by contributor vote.
        </p>
        <div className="mt-6 flex gap-3">
          <Link href="/explore" className="rounded-lg bg-brand px-5 py-2.5 font-medium text-white hover:bg-brand-dark">
            Explore campaigns
          </Link>
          <Link href="/create" className="rounded-lg border border-gray-300 px-5 py-2.5 font-medium hover:bg-gray-50">
            Create a campaign
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          ["1. Create", "Set a target, deadline, and milestones that add up to 100%."],
          ["2. Contribute", "Anyone can fund with ETH. Funds stay locked in the contract."],
          ["3. Release or refund", "Contributors vote to release each milestone, or reclaim refunds if the goal is missed."],
        ].map(([t, d]) => (
          <div key={t} className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="font-semibold">{t}</h3>
            <p className="mt-1 text-sm text-gray-600">{d}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
