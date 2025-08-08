import { RozoPayOrderView } from "@rozoai/intent-common";

export interface PaymentResult {
  success: boolean;
  payment?: RozoPayOrderView;
  source?: "rozo" | "daimo";
  error?: string;
}

interface ApiResponse {
  success: boolean;
  data?: RozoPayOrderView;
  error?: string;
}

interface ApiConfig {
  url: string;
  headers: Record<string, string>;
}

// Environment variable validation
function validateEnvironment(): { rozo: ApiConfig; daimo: ApiConfig } | null {
  const rozoUrl = process.env.ROZO_API_URL;
  const rozoKey = process.env.ROZO_API_KEY;
  const daimoUrl = process.env.DAIMO_API_URL;
  const daimoKey = process.env.DAIMO_API_KEY;

  if (!rozoUrl || !rozoKey || !daimoUrl || !daimoKey) {
    return null;
  }

  return {
    rozo: {
      url: rozoUrl,
      headers: {
        Authorization: `Bearer ${rozoKey}`,
        "Content-Type": "application/json",
      },
    },
    daimo: {
      url: daimoUrl,
      headers: { "Api-Key": daimoKey, "Content-Type": "application/json" },
    },
  };
}

// Generic API fetcher
async function fetchFromAPI(
  url: string,
  headers: Record<string, string>
): Promise<ApiResponse> {
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    });

    if (!response.ok) {
      return {
        success: false,
        error: `API request failed: ${response.status} ${response.statusText}`,
      };
    }

    const data = (await response.json()) as RozoPayOrderView;
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Main payment fetcher with fallback strategy
export async function getPaymentData(id: string): Promise<PaymentResult> {
  if (!id) {
    return { success: false, error: "Payment ID is required" };
  }

  const config = validateEnvironment();
  if (!config) {
    return {
      success: false,
      error:
        "API configuration is missing. Please check environment variables.",
    };
  }

  // Try Rozo API first
  const rozoResponse = await fetchFromAPI(
    `${config.rozo.url}/payment-api/external-id/${id}`,
    config.rozo.headers
  );

  if (rozoResponse.success && rozoResponse.data) {
    return {
      success: true,
      payment: rozoResponse.data,
      source: "rozo",
    };
  }

  // Rozo API failed, try Daimo API as fallback
  console.warn(
    "Rozo API failed, falling back to Daimo API:",
    rozoResponse.error
  );

  const daimoResponse = await fetchFromAPI(
    `${config.daimo.url}/payment/${id}`,
    config.daimo.headers
  );

  if (daimoResponse.success && daimoResponse.data) {
    return {
      success: true,
      payment: daimoResponse.data,
      source: "daimo",
    };
  }

  // Both APIs failed
  return {
    success: false,
    error: `Payment failed to fetch from both APIs. Rozo: ${rozoResponse.error}, Daimo: ${daimoResponse.error}`,
  };
}
