import { parseEthereum } from "./ethereum";
import { parseSolana } from "./solana";
import { parseStellar } from "./stellar";
import type { QRCodeData } from "./types";
import { parseWebsite } from "./website";

interface QRCodeParser {
	name: string;
	parse: (input: string) => QRCodeData | null;
}

const parsers: QRCodeParser[] = [
	{ name: "website", parse: parseWebsite },
	{ name: "ethereum", parse: parseEthereum },
	{ name: "solana", parse: parseSolana },
	{ name: "stellar", parse: parseStellar },
];

export function parseQRCode(input: string): QRCodeData {
	for (const parser of parsers) {
		const result = parser.parse(input);
		if (result) return result;
	}
	return { type: "unknown" };
}
