"use client";
import { useEffect, useState } from "react";
import { connectWallet, onAccountChange, hasMetaMask } from "@lib/web3";
import { shortAddr } from "@lib/format";

export function WalletButton() {
  const [account, setAccount] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    onAccountChange((accts) => setAccount(accts[0] ?? ""));
  }, []);

  async function connect() {
    setError("");
    try {
      setAccount(await connectWallet());
    } catch (e: any) {
      setError(e?.message ?? "Failed to connect");
    }
  }

  if (!hasMetaMask()) {
    return <span className="text-sm text-gray-500">Install MetaMask</span>;
  }

  return (
    <button
      onClick={connect}
      className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
      title={error}
    >
      {account ? shortAddr(account) : "Connect Wallet"}
    </button>
  );
}
