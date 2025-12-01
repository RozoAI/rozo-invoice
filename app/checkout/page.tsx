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

  try {
    const response = await getPaymentData(id);
    if (!response.success) {
      return {
        success: false,
        error: `Failed to fetch payment data: ${response.error}`,
      };
    }

    const paymentData = response.payment;

    return {
      success: true,
      payment: paymentData as PaymentData,
      appId:
        paymentData &&
        ("appId" in paymentData
          ? paymentData.appId
          : paymentData.metadata?.appId ?? process.env.NEXT_PUBLIC_ROZO_APP_ID),
    };
  } catch (error) {
    return { success: false, error };
  }
}

export default async function Checkout({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; appId?: string }>;
}): Promise<ReactElement> {
  const { id, appId } = await searchParams;
  const loaderData = await getPayment(id || "");

  if (!loaderData.success) {
    return redirectToError({
      type: id ? "PAYMENT_NOT_FOUND" : "INVALID_REQUEST",
      ...(id && { id }),
    });
  }

  return <CheckoutContent loaderData={loaderData} appId={appId} />;
}
