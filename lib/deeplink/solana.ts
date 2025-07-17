import type { QRCodeData } from "./types";

export function parseSolana(input: string): QRCodeData | null {
	const solanaPayRegex = /^solana:([1-9A-HJ-NP-Za-km-z]{32,44})(\?.*)?$/;
	if (solanaPayRegex.test(input)) {
		return {
			type: "solana",
			message: "Solana payment coming soon.",
		};
	}

	const solanaAddressRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
	if (solanaAddressRegex.test(input)) {
		return {
			type: "solana",
			address: input,
			message: "Solana payment coming soon.",
		};
	}

	return null;
}
