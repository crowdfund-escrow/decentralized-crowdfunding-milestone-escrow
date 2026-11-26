import { CHAIN_ID } from "./contract";

const SEPOLIA_HEX = "0x" + CHAIN_ID.toString(16); // 0xaa36a7

export function hasMetaMask(): boolean {
  return typeof window !== "undefined" && Boolean((window as any).ethereum);
}

/** Prompt the user to connect and return the selected address. */
export async function connectWallet(): Promise<string> {
  if (!hasMetaMask()) throw new Error("MetaMask not detected");
  const [account] = await (window as any).ethereum.request({ method: "eth_requestAccounts" });
  await ensureSepolia();
  return account;
}

/** Make sure the wallet is on Sepolia; ask it to switch if not. */
export async function ensureSepolia(): Promise<void> {
  const current = await (window as any).ethereum.request({ method: "eth_chainId" });
  if (current === SEPOLIA_HEX) return;
  try {
    await (window as any).ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: SEPOLIA_HEX }],
    });
  } catch (e) {
    throw new Error("Please switch MetaMask to the Sepolia test network.");
  }
}

export function onAccountChange(cb: (accounts: string[]) => void) {
  if (hasMetaMask()) (window as any).ethereum.on("accountsChanged", cb);
}
