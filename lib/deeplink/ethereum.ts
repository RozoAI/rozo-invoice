import { getAddress } from "viem";
import type { QRCodeData } from "./types";
import { baseUSDC } from "@rozoai/intent-common";

export function parseEthereum(input: string): QRCodeData | null {
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
			type: "eip681",
			transfer: {
				protocol: "ethereum",
				contractAddress: getAddress(contractAddress),
				chainId: chainIdStr
					? Number.parseInt(chainIdStr, 10)
					: baseUSDC.chainId,
				functionName: functionName.toLowerCase(),
				recipient: getAddress(recipient),
				amount,
			},
		};
	}

	const evmAddressRegex = /^0x[a-fA-F0-9]{40}$/;
	if (evmAddressRegex.test(input)) {
		return {
			type: "address",
			transfer: {
				protocol: "ethereum",
				contractAddress: baseUSDC.token as `0x${string}`, // USDC BASE Contract Address
				chainId: baseUSDC.chainId, // BASE NETWORK
				recipient: getAddress(input),
			},
			message:
				"Detected EVM address. Please make sure you are sending to Base.",
		};
	}

	return null;
}
