import ReceiptContent from "@/components/payment/receipt-content";
import { RozoPayOrderView } from "@rozoai/intent-common";
import { redirect } from "next/navigation";

type LoaderData = {
  success: boolean;
  payment?: RozoPayOrderView;
  source?: string;
  error?: unknown;
  theme?: string;
};

// Helper function to fetch payment data from a specific API
async function fetchPaymentFromAPI(
  url: string,
  headers: Record<string, string>
): Promise<{ success: boolean; data?: RozoPayOrderView; error?: string }> {
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

async function getPayment(id: string): Promise<LoaderData> {
  if (!id) {
    return { success: false, error: "Payment ID is required" };
  }

  // Validate required environment variables
  if (!process.env.ROZO_API_URL || !process.env.ROZO_API_KEY) {
    return {
      success: false,
      error: "Rozo API configuration is missing",
    };
  }

  if (!process.env.DAIMO_API_URL || !process.env.DAIMO_API_KEY) {
    return {
      success: false,
      error: "Daimo API configuration is missing",
    };
  }

  try {
    // Try Rozo API first
    const rozoResult = await fetchPaymentFromAPI(
      `${process.env.ROZO_API_URL}/payment-api/external-id/${id}`,
      { Authorization: `Bearer ${process.env.ROZO_API_KEY}` }
    );

    console.log("rozoResult", rozoResult);

    if (rozoResult.success && rozoResult.data) {
      return {
        success: true,
        payment: rozoResult.data,
        source: "rozo",
      };
    }

    // Fallback to Daimo API if Rozo API fails
    console.warn(
      "Rozo API failed, falling back to Daimo API:",
      rozoResult.error
    );

    const daimoResult = await fetchPaymentFromAPI(
      `${process.env.DAIMO_API_URL}/payment/${id}`,
      { "Api-Key": process.env.DAIMO_API_KEY }
    );

    console.log("daimoResult", daimoResult);

    if (daimoResult.success && daimoResult.data) {
      return {
        success: true,
        payment: daimoResult.data,
        source: "daimo",
      };
    }

    // Both APIs failed
    return {
      success: false,
      error: `Payment not found. Rozo API: ${rozoResult.error}, Daimo API: ${daimoResult.error}`,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unexpected error occurred",
    };
  }
}

export default async function Receipt({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const loaderData = await getPayment(id || "");

  if (!loaderData.success) {
    return redirect("/error");
  }

  return <ReceiptContent payment={loaderData.payment!} />;
}
