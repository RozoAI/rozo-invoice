import { baseUSDC } from "@rozoai/intent-common";
import { getAddress } from "viem";
import type { DeeplinkData } from "../types";

export function parseEthereum(input: string): DeeplinkData | null {
  const transferRegex =
    /^ethereum:(0x[a-fA-F0-9]{40})(?:@(\d+))?\/(\w+)\?(.+)$/;
  const match = input.match(transferRegex);

  if (match) {
    const [, contractAddress, chainIdStr, functionName, queryString] = match;

    const params = new URLSearchParams(queryString);
    const recipient = params.get("address");
    const amount = params.get("uint256") || undefined;

    if (!recipient) return null;

    return {
      type: "ethereum",
      operation: functionName.toLowerCase(),
      asset: {
        contract: getAddress(contractAddress),
      },
      chain_id: chainIdStr ? Number.parseInt(chainIdStr, 10) : baseUSDC.chainId,
      recipients: [
        {
          address: getAddress(recipient),
          amount,
        },
      ],
      message: "Ethereum transfer",
    };
  }

  return null;
}
