import { ethers } from "ethers";

export const weiToEth = (wei: string | bigint): string => ethers.formatEther(wei ?? 0n);
export const ethToWei = (eth: string): bigint => ethers.parseEther(eth || "0");

export const shortAddr = (a?: string): string =>
  a ? `${a.slice(0, 6)}...${a.slice(-4)}` : "";

export const pct = (raisedWei: string, goalWei: string): number => {
  try {
    const r = Number(ethers.formatEther(raisedWei || "0"));
    const g = Number(ethers.formatEther(goalWei || "0"));
    return g > 0 ? Math.min(100, Math.round((r / g) * 100)) : 0;
  } catch {
    return 0;
  }
};
