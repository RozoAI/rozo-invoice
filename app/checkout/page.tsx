import CheckoutContent from "@/components/payment/checkout-content";
import { redirectToError } from "@/lib/error-utils";
import { getPaymentData, PaymentResponse } from "@/lib/payment-api";
import type { RozoPayOrderView } from "@rozoai/intent-common";
import type { ReactElement } from "react";

type PaymentData = RozoPayOrderView | PaymentResponse;

type LoaderData = {
  success: boolean;
  payment?: PaymentData;
  appId?: string;
  error?: unknown;
  theme?: string;
};

async function getPayment(id: string): Promise<LoaderData> {
  if (!id) {
    return { success: false, error: "Payment ID is required" };
  }

  // TODO: Temporary DAIMO API integration - We need to migrate to our internal API
  // The current implementation uses DAIMO API because our internal API only supports IDs
  // registered in our database. Some orders created via Rozo SDK still follow the Daimo flow.
  // Future work: Unify API endpoints and migrate all payment processing to internal systems or make our internal API support all IDs.
  try {
    const response = await getPaymentData(id);
    console.log("response", response);
    if (!response.success) {
      return {
        success: false,
        error: `Failed to fetch payment data: ${response.error}`,
      };
    }

    const paymentData = response.payment;

    // Check if the response is from Daimo API (RozoPayOrderView)
    // Checkout page only supports Daimo payments
    if (response.source !== "daimo") {
      return {
        success: false,
        error:
          "Checkout is only available for Daimo payments. Please use the receipt page instead.",
      };
    }

    return {
      success: true,
      payment: paymentData as PaymentData,
      appId: process.env.DAIMO_API_KEY,
    };
  } catch (error) {
    return { success: false, error };
  }
}

export default async function Checkout({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}): Promise<ReactElement> {
  const { id } = await searchParams;
  const loaderData = await getPayment(id || "");
  console.log("loaderData", loaderData);
  if (!loaderData.success) {
    return redirectToError({
      type: id ? "PAYMENT_NOT_FOUND" : "INVALID_REQUEST",
      ...(id && { id }),
    });
  }

  return <CheckoutContent loaderData={loaderData} />;
}
