import { baseUSDC } from "@rozoai/intent-common";
import { getAddress } from "viem";
import type { DeeplinkData } from "../types";

export function parseAddress(input: string): DeeplinkData | null {
  try {
    const address = getAddress(input);
    return {
      type: "address",
      address: address,
      operation: "transfer",
      chain_id: baseUSDC.chainId,
      asset: {
        contract: getAddress(baseUSDC.token),
      },
      message:
        "Detected EVM address. Please make sure you are sending to Base.",
    };
  } catch {
    return null;
  }
}
