import { ethers } from "ethers";
// After BC deploys, copy the ABI to lib/abi/CrowdfundingEscrow.json and import it:
// import abi from "./abi/CrowdfundingEscrow.json";

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "";
export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 11155111); // Sepolia

/** Read-only contract instance (uses the injected provider). */
export function getReadContract(abi: ethers.InterfaceAbi) {
  if (!CONTRACT_ADDRESS) throw new Error("NEXT_PUBLIC_CONTRACT_ADDRESS not set");
  const provider = new ethers.BrowserProvider((window as any).ethereum);
  return new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
}

/** Write contract instance (uses the connected signer). */
export async function getWriteContract(abi: ethers.InterfaceAbi) {
  if (!CONTRACT_ADDRESS) throw new Error("NEXT_PUBLIC_CONTRACT_ADDRESS not set");
  const provider = new ethers.BrowserProvider((window as any).ethereum);
  const signer = await provider.getSigner();
  return new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
}
