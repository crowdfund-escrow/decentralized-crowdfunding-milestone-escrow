import Link from "next/link";
import { WalletButton } from "./WalletButton";

export function Nav() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-bold text-brand">
          CrowdfundEscrow
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/explore" className="hover:text-brand">Explore</Link>
          <Link href="/create" className="hover:text-brand">Create</Link>
          <Link href="/dashboard" className="hover:text-brand">Dashboard</Link>
          <WalletButton />
        </div>
      </nav>
    </header>
  );
}
