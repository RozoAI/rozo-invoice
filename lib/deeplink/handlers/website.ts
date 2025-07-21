import type { DeeplinkData } from "../types";

export function parseWebsite(input: string): DeeplinkData | null {
  if (input.startsWith("http://") || input.startsWith("https://")) {
    return {
      type: "website",
      url: input,
    };
  }
  return null;
}
