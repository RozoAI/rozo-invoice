import { RozoPayOrderView } from "@rozoai/intent-common";

export interface PaymentResponse {
  id: string;
  status: string;
  message?: string;
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
    appId: string;
    items: Array<{
      name: string;
      description?: string;
    }>;
    payer: Record<string, any>;
    intent: string;
    flush_tx: string;
    webhookUrl: string;
    processing_method: string;
    forwarder_processed: boolean;
    forwarder_processed_at: string;
    forMerchant?: boolean;
  };
  payinTransactionHash: string;
  payoutTransactionHash: string;
}

/**
 * FeeType, Fee calculation type:
 * - exactIn (default): Fee deducted from input, recipient receives amount - fee
 * - exactOut: Fee added to input, recipient receives exact amount
 */
export enum FeeType {
  ExactIn = "exactIn",
  ExactOut = "exactOut",
}

/**
 * PaymentStatus, Payment status
 */
export enum PaymentStatus {
  PaymentBounced = "payment_bounced",
  PaymentCompleted = "payment_completed",
  PaymentExpired = "payment_expired",
  PaymentPayinCompleted = "payment_payin_completed",
  PaymentPayoutCompleted = "payment_payout_completed",
  PaymentRefunded = "payment_refunded",
  PaymentStarted = "payment_started",
  PaymentUnpaid = "payment_unpaid",
}

/**
 * PaymentErrorCode, Error code (only present when status is payment_bounced)
 */
export enum PaymentErrorCode {
  AmountTooHigh = "amountTooHigh",
  AmountTooLow = "amountTooLow",
  ChainUnavailable = "chainUnavailable",
  InsufficientLiquidity = "insufficientLiquidity",
  InvalidRecipient = "invalidRecipient",
  MissingTrustline = "missingTrustline",
  NetworkError = "networkError",
  ProviderError = "providerError",
  ServiceMaintenance = "serviceMaintenance",
}

/**
 * DestinationRequest
 */
export interface DestinationRequest {
  /**
   * Receive amount (required for type=exactOut).
   * For exactIn, this field is omitted in request and calculated in response.
   */
  amount?: string;
  chainId: number;
  /**
   * Final recipient's wallet address
   */
  receiverAddress: string;
  /**
   * Memo for Stellar/Solana destinations
   */
  receiverMemo?: string;
  /**
   * Override default token address
   */
  tokenAddress?: string;
  tokenSymbol: string;
  [property: string]: any;
}

/**
 * DisplayInfo
 */
export interface DisplayInfo {
  /**
   * Display currency
   */
  currency: string;
  /**
   * Detailed description
   */
  description?: string;
  /**
   * Short title
   */
  title: string;
  [property: string]: any;
}

/**
 * SourceRequest
 */
export interface SourceRequest {
  /**
   * Pay-in amount (required for type=exactIn).
   * For exactOut, this field is omitted in request and calculated in response.
   */
  amount?: string;
  chainId: number;
  /**
   * Override default token address
   */
  tokenAddress?: string;
  tokenSymbol: string;
  [property: string]: any;
}

/**
 * DestinationResponse
 */
export interface DestinationResponse {
  /**
   * Amount to be sent to recipient
   */
  amount?: string;
  chainId?: number;
  /**
   * Withdrawal confirmation time
   */
  confirmedAt?: Date;
  /**
   * Final recipient's wallet
   */
  receiverAddress?: string;
  /**
   * Memo for Stellar/Solana
   */
  receiverMemo?: string;
  /**
   * Token contract address
   */
  tokenAddress?: string;
  tokenSymbol?: string;
  /**
   * Withdrawal transaction hash
   */
  txHash?: string;
  [property: string]: any;
}

/**
 * SourceResponse
 */
export interface SourceResponse {
  /**
   * Amount payer must send
   */
  amount?: string;
  /**
   * Actual amount received
   */
  amountReceived?: string;
  chainId?: number;
  /**
   * Deposit confirmation time
   */
  confirmedAt?: Date;
  /**
   * Fee amount
   */
  fee?: string;
  /**
   * Deposit address (where payer sends funds)
   */
  receiverAddress?: string;
  /**
   * Memo for Stellar/Solana deposits
   */
  receiverMemo?: string;
  /**
   * Payer's wallet address (populated after deposit)
   */
  senderAddress?: string;
  /**
   * Token contract address
   */
  tokenAddress?: string;
  tokenSymbol?: string;
  /**
   * Deposit transaction hash
   */
  txHash?: string;
  [property: string]: any;
}

/**
 * NewPaymentResponse
 */
export interface NewPaymentResponse {
  /**
   * Your application ID
   */
  appId: string;
  /**
   * ISO 8601 timestamp
   */
  createdAt: Date;
  destination: DestinationResponse;
  display: DisplayInfo;
  errorCode: PaymentErrorCode | null;
  /**
   * ISO 8601 timestamp (when payment expires)
   */
  expiresAt: Date;
  /**
   * Payment ID
   */
  id: string;
  metadata: { [key: string]: any } | null;
  /**
   * Your order reference ID
   */
  orderId: string | null;
  source: SourceResponse;
  status: PaymentStatus;
  type: FeeType;
  /**
   * ISO 8601 timestamp
   */
  updatedAt: Date;
  /**
   * Secret for webhook signature verification.
   * Only present when webhookUrl was provided in the request.
   * Store this securely to verify incoming webhook signatures.
   */
  webhookSecret: string | null;
  [property: string]: any;
}

export interface PaymentResult {
  success: boolean;
  payment?: PaymentResponse | RozoPayOrderView | NewPaymentResponse;
  source?: "rozo" | "newRozo";
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
function validateEnvironment(): { rozo: ApiConfig; newRozo: ApiConfig } | null {
  const rozoUrl = process.env.ROZO_API_URL;
  const rozoKey = process.env.ROZO_API_KEY;
  const newRozoUrl = process.env.NEW_ROZO_API_URL;

  const missing = [];
  if (!rozoUrl) missing.push("ROZO_API_URL");
  if (!rozoKey) missing.push("ROZO_API_KEY");
  if (!newRozoUrl) missing.push("NEW_ROZO_API_URL");

  if (missing.length > 0) {
    console.error("Missing environment variables:", missing.join(", "));
    return null;
  }

  return {
    rozo: {
      url: rozoUrl!,
      headers: {
        Authorization: `Bearer ${rozoKey!}`,
        "Content-Type": "application/json",
      },
    },
    newRozo: {
      url: newRozoUrl!,
      headers: {
        Authorization: `Bearer ${rozoKey!}`,
        "Content-Type": "application/json",
      },
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
  isHash: boolean = false,
  isMugglePay: boolean = false
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
  const endpoint = isHash
    ? `payment/tx/${idOrHash}`
    : isMugglePay
    ? `payment-api/${idOrHash}`
    : `payment/id/${idOrHash}`;
  console.log("Endpoint:", endpoint);
  // Try Rozo API first
  const rozoUrl = `${config.rozo.url}/${endpoint}`;
  console.log("Rozo API URL:", rozoUrl);
  const rozoResponse = await fetchFromAPI(rozoUrl, config.rozo.headers);

  if (rozoResponse.success && rozoResponse.data) {
    return {
      success: true,
      payment: rozoResponse.data as PaymentResponse,
      source: "rozo",
    };
  }

  console.log(
    "Rozo API failed, falling back to new Rozo API:",
    rozoResponse.error
  );
  // Rozo API failed, try new Rozo   API as fallback (only for ID-based requests)
  console.warn(
    "Rozo API failed, falling back to new Rozo API:",
    rozoResponse.error
  );

  // Only try new Rozo API for ID-based requests, not hash-based
  if (!isHash) {
    const url = `${config.newRozo.url}/payment-api/payments/${idOrHash}`;

    console.log("New Rozo API URL:", url);

    const newRozoResponse = await fetchFromAPI(url, config.newRozo.headers);

    if (newRozoResponse.success && newRozoResponse.data) {
      return {
        success: true,
        payment: newRozoResponse.data as unknown as NewPaymentResponse,
        source: "newRozo",
      };
    }

    console.log("new Rozo API failed:", newRozoResponse.error);

    // Both APIs failed
    return {
      success: false,
      error: `Payment failed to fetch from both APIs. Rozo: ${rozoResponse.error}, new Rozo: ${newRozoResponse.error}`,
    };
  }

  // Hash-based request failed from Rozo API only
  return {
    success: false,
    error: `Payment failed to fetch from Rozo API: ${rozoResponse.error}`,
  };
}

// Client-side function to fetch payment data via API route
export async function getPaymentDataClient(
  idOrHash: string,
  isHash: boolean = false
): Promise<PaymentResult> {
  try {
    const url = `/api/payment/${idOrHash}${isHash ? "?isHash=true" : ""}`;
    const response = await fetch(url);
    const result = await response.json();
    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Track active polling instances to prevent concurrent polling for the same ID
const activePolling = new Map<string, { cancel: () => void }>();

// Client-side polling function to fetch payment data until destination hash exists
export async function pollPaymentUntilPayoutClient(
  id: string,
  intervalMs: number = 5000, // 5 seconds
  maxAttempts: number = 60 // 5 minutes max (60 * 5s)
): Promise<PaymentResult> {
  // Cancel any existing polling for this ID
  const existing = activePolling.get(id);
  if (existing) {
    existing.cancel();
  }

  return new Promise((resolve, reject) => {
    let attempts = 0;
    let resolved = false;
    let cancelled = false;
    let timeoutId: NodeJS.Timeout | null = null;

    const cancel = () => {
      cancelled = true;
      resolved = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      activePolling.delete(id);
    };

    // Register this polling instance
    activePolling.set(id, { cancel });

    const poll = async () => {
      // Prevent multiple concurrent polls
      if (resolved || cancelled) return;

      attempts++;

      try {
        const result = await getPaymentDataClient(id);

        if (cancelled) return;

        if (!result.success) {
          if (attempts >= maxAttempts) {
            if (!resolved) {
              resolved = true;
              activePolling.delete(id);
              reject(
                new Error(
                  `Polling failed after ${maxAttempts} attempts: ${result.error}`
                )
              );
            }
            return;
          }

          if (!resolved && !cancelled) {
            timeoutId = setTimeout(poll, intervalMs);
          }
          return;
        }

        // Check if any destination hash exists (payoutTransactionHash or destination.txHash)
        const payment = result.payment as PaymentResponse;
        const hasPayoutHash =
          payment?.payoutTransactionHash ||
          (payment?.destination &&
            "txHash" in payment.destination &&
            payment.destination.txHash);
        const hasCompletedStatus =
          result.payment?.status === "payment_completed" ||
          result.payment?.status === "payment_payout_completed";

        // Resolve once with the result
        if (!resolved) {
          resolved = true;
          activePolling.delete(id);
          resolve(result);
        }

        // Stop polling if we have the payout hash or completed status
        if (hasPayoutHash || hasCompletedStatus) {
          return;
        }

        // Check if we've reached max attempts
        if (attempts >= maxAttempts) {
          if (!resolved) {
            resolved = true;
            activePolling.delete(id);
            reject(
              new Error(
                `Polling timeout: destination hash (payoutTransactionHash or destination.txHash) not found after ${maxAttempts} attempts`
              )
            );
          }
          return;
        }

        // Continue polling only if not resolved yet
        if (!resolved && !cancelled) {
          timeoutId = setTimeout(poll, intervalMs);
        }
      } catch (error) {
        if (cancelled) return;

        if (attempts >= maxAttempts) {
          if (!resolved) {
            resolved = true;
            activePolling.delete(id);
            reject(error);
          }
          return;
        }

        if (!resolved && !cancelled) {
          timeoutId = setTimeout(poll, intervalMs);
        }
      }
    };

    poll();
  });
}

// Polling function to fetch payment data until destination hash exists (payoutTransactionHash or destination.txHash)
export async function pollPaymentUntilPayout(
  id: string,
  maxAttempts: number = 60, // 5 minutes max (60 * 5s)
  intervalMs: number = 5000 // 5 seconds
): Promise<PaymentResult> {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const poll = async () => {
      attempts++;

      try {
        const result = await getPaymentData(id);

        if (!result.success) {
          if (attempts >= maxAttempts) {
            reject(
              new Error(
                `Polling failed after ${maxAttempts} attempts: ${result.error}`
              )
            );
            return;
          }
          // Continue polling on API errors
          setTimeout(poll, intervalMs);
          return;
        }

        // Check if any destination hash exists (payoutTransactionHash or destination.txHash)
        const payment = result.payment as PaymentResponse;
        const hasPayoutHash = payment?.payoutTransactionHash;
        const hasDestinationTxHash =
          payment?.destination &&
          "txHash" in payment.destination &&
          payment.destination.txHash;

        if (hasPayoutHash || hasDestinationTxHash) {
          console.log(
            `[pollPaymentUntilPayout] Success! Found destination hash after ${attempts} attempts`
          );
          resolve(result);
          return;
        }

        // Check if we've reached max attempts
        if (attempts >= maxAttempts) {
          console.error(
            `[pollPaymentUntilPayout] Timeout: No destination hash found after ${maxAttempts} attempts`
          );
          reject(
            new Error(
              `Polling timeout: destination hash (payoutTransactionHash or destination.txHash) not found after ${maxAttempts} attempts`
            )
          );
          return;
        }

        // Continue polling
        setTimeout(poll, intervalMs);
      } catch (error) {
        if (attempts >= maxAttempts) {
          reject(error);
          return;
        }
        // Continue polling on unexpected errors
        console.log(
          `[pollPaymentUntilPayout] Retrying after error in ${intervalMs}ms...`
        );
        setTimeout(poll, intervalMs);
      }
    };

    // Start polling immediately
    console.log(
      `[pollPaymentUntilPayout] Starting polling for payment ID: ${id}`
    );
    poll();
  });
}
