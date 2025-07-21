import { baseUSDC } from "@rozoai/intent-common";
import { getAddress } from "viem";
import type { DeeplinkData } from "../types";

export function parseAddress(input: string): DeeplinkData | null {
  if (getAddress(input)) {
    return {
      type: "address",
      address: getAddress(input),
      operation: "transfer",
      chain_id: baseUSDC.chainId,
      asset: {
        contract: getAddress(baseUSDC.token),
      },
      message:
        "Detected EVM address. Please make sure you are sending to Base.",
    };
  }

  return null;
}
