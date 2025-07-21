import { baseUSDC } from "@rozoai/intent-common";
import { getAddress } from "viem";
import type { QRCodeData } from "./types";

export function parseAddress(input: string): QRCodeData | null {
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
