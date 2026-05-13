import type { Metadata } from "next";
import type { ReactElement } from "react";
import { cache } from "react";

import CheckoutContent from "@/components/payment/checkout-content";
import { redirectToError } from "@/lib/error-utils";
import {
  getPaymentData,
  NewPaymentResponse,
  PaymentResponse,
} from "@/lib/payment-api";
import { getPaymentAmount } from "@/lib/utils";
import type { RozoPayOrderView } from "@rozoai/intent-common";

type PaymentData = RozoPayOrderView | PaymentResponse | NewPaymentResponse;

type LoaderData = {
  success: boolean;
  payment?: PaymentData;
  appId?: string;
  error?: unknown;
  theme?: string;
  apiVersion?: "v1" | "v2";
};

const getPayment = cache(async (id: string): Promise<LoaderData> => {
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
      apiVersion: response.source === "rozo" ? "v1" : "v2",
      appId:
        paymentData &&
        ("appId" in paymentData
          ? paymentData.appId
          : (paymentData.metadata?.appId ??
            process.env.NEXT_PUBLIC_ROZO_APP_ID)),
    };
  } catch (error) {
    return { success: false, error };
  }
});

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}): Promise<Metadata> {
  const { id } = await searchParams;
  const title = "Rozo | One Tap to Pay";
  if (!id) {
    return { title: title };
  }

  const loaderData = await getPayment(id);

  if (!loaderData.success || !loaderData.payment) {
    return { title: "Payment Not Found" };
  }

  const payment = loaderData.payment;

  return {
    title: `Pay ${getPaymentAmount(payment)} - ${title}`,
  };
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
