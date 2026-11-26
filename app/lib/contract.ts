import { ethers } from "ethers";
import abi from "./abi/CrowdfundingEscrow.json";

export const CONTRACT_ABI = abi as ethers.InterfaceAbi;
export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "";
export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 11155111); // Sepolia

export function getBrowserProvider(): ethers.BrowserProvider {
  if (typeof window === "undefined" || !(window as any).ethereum) {
    throw new Error("No wallet detected");
  }
  return new ethers.BrowserProvider((window as any).ethereum);
}

export function getReadContract(): ethers.Contract {
  if (!CONTRACT_ADDRESS) throw new Error("NEXT_PUBLIC_CONTRACT_ADDRESS not set");
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, getBrowserProvider());
}

export async function getWriteContract(): Promise<ethers.Contract> {
  if (!CONTRACT_ADDRESS) throw new Error("NEXT_PUBLIC_CONTRACT_ADDRESS not set");
  const signer = await getBrowserProvider().getSigner();
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
}

/** keccak256 of an off-chain metadata object, for on-chain metadataHash fields. */
export function metaHash(obj: unknown): string {
  return ethers.id(JSON.stringify(obj));
}
