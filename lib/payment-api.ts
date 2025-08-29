import { RozoPayOrderView } from "@rozoai/intent-common";

export interface PaymentResponse {
  id: string;
  status: string;
  createdAt: string;
  receivingAddress: string;
  display: {
    name: string;
    logoUrl: string;
    description: string;
  };
  source: null;
  payinchainid: string;
  payintokenaddress: string;
  destination: {
    chainId: string;
    tokenAddress: string;
    destinationAddress: string;
    amountUnits: string;
  };
  externalId: string | null;
  metadata: {
    items: any[];
    payer: Record<string, any>;
    intent: string;
    flush_tx: string;
    webhookUrl: string;
    daimoOrderId: string;
    processing_method: string;
    forwarder_processed: boolean;
    forwarder_processed_at: string;
  };
  payinTransactionHash: string;
  payoutTransactionHash: string;
}

export interface PaymentResult {
  success: boolean;
  payment?: PaymentResponse | RozoPayOrderView;
  source?: "rozo" | "daimo";
  error?: string;
}

interface ApiResponse {
  success: boolean;
  data?: PaymentResponse | RozoPayOrderView;
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

    const data = (await response.json()) as PaymentResponse | RozoPayOrderView;
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Main payment fetcher with fallback strategy
export async function getPaymentData(
  idOrHash: string,
  isHash: boolean = false
): Promise<PaymentResult> {
  if (!idOrHash) {
    return { success: false, error: "Payment ID or hash is required" };
  }

  const config = validateEnvironment();
  if (!config) {
    return {
      success: false,
      error:
        "API configuration is missing. Please check environment variables.",
    };
  }

  // Determine the endpoint based on whether it's an ID or hash
  const endpoint = isHash ? `payment/tx/${idOrHash}` : `payment/id/${idOrHash}`;

  // Try Rozo API first
  const rozoResponse = await fetchFromAPI(
    `${config.rozo.url}/${endpoint}`,
    config.rozo.headers
  );

  if (rozoResponse.success && rozoResponse.data) {
    return {
      success: true,
      payment: rozoResponse.data as PaymentResponse,
      source: "rozo",
    };
  }

  console.log(
    "Rozo API failed, falling back to Daimo API:",
    rozoResponse.error
  );
  // Rozo API failed, try Daimo API as fallback (only for ID-based requests)
  console.warn(
    "Rozo API failed, falling back to Daimo API:",
    rozoResponse.error
  );

  // Only try Daimo API for ID-based requests, not hash-based
  if (!isHash) {
    const daimoResponse = await fetchFromAPI(
      `${config.daimo.url}/payment/${idOrHash}`,
      config.daimo.headers
    );

    if (daimoResponse.success && daimoResponse.data) {
      return {
        success: true,
        payment: daimoResponse.data as RozoPayOrderView,
        source: "daimo",
      };
    }

    console.log("Daimo API failed:", daimoResponse.error);

    // Both APIs failed
    return {
      success: false,
      error: `Payment failed to fetch from both APIs. Rozo: ${rozoResponse.error}, Daimo: ${daimoResponse.error}`,
    };
  }

  // Hash-based request failed from Rozo API only
  return {
    success: false,
    error: `Payment failed to fetch from Rozo API: ${rozoResponse.error}`,
  };
}
