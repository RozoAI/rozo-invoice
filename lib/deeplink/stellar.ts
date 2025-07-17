import type { QRCodeData } from "./types";

export function parseStellar(input: string): QRCodeData | null {
	const paymentRegex = /^web\+stellar:pay\?(.+)$/;
	if (paymentRegex.test(input)) {
		return {
			type: "stellar",
			message: "Stellar payment coming soon.",
		};
	}

	const stellarAddressRegex = /^G[A-Z2-7]{55}$/;
	if (stellarAddressRegex.test(input)) {
		return {
			type: "stellar",
			address: input,
			message: "Stellar payment coming soon.",
		};
	}

	return null;
}
