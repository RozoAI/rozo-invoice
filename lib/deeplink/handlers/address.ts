import { baseUSDC } from "@rozoai/intent-common";
import { getAddress } from "viem";
import { isValidSolanaAddress } from "../protocols/solana";
import { isValidStellarAddress } from "../protocols/stellar";
import type { DeeplinkData } from "../types";

export function parseAddress(input: string): DeeplinkData | null {
  if (isValidSolanaAddress(input)) {
    return {
      type: "solana",
      address: input,
      message: "Detected Solana address.",
    };
  }

  if (isValidStellarAddress(input)) {
    return {
      type: "stellar",
      toStellarAddress: input,
      address: "0x5772FBe7a7817ef7F586215CA8b23b8dD22C8897",
      operation: "pay",
      chain_id: baseUSDC.chainId,
      asset: {
        contract: getAddress(baseUSDC.token),
      },
      message: "Detected Stellar address. RozoPay will bridge to it.",
    };
  }

  try {
    const evmAddress = getAddress(input);
    return {
      type: "ethereum",
      address: evmAddress,
      operation: "transfer",
      chain_id: baseUSDC.chainId,
      asset: {
        contract: getAddress(baseUSDC.token),
      },
      message:
        "Detected EVM address. Please make sure you are sending to Base.",
    };
  } catch {
    // Not a valid EVM address
  }

  return null;
}
