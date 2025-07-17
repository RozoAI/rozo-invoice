import type { QRCodeData } from "./types";

export function parseWebsite(input: string): QRCodeData | null {
	if (input.startsWith("http://") || input.startsWith("https://")) {
		return {
			type: "website",
			website: input,
		};
	}
	return null;
}
