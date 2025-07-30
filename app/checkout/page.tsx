import CheckoutContent from "@/components/payment/checkout-content";
import type { RozoPayOrderView } from "@rozoai/intent-common";
import { redirect } from "next/navigation";
import type { ReactElement } from "react";

type LoaderData = {
  success: boolean;
  payment?: RozoPayOrderView;
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
    const headers = {
      "Api-Key": process.env.DAIMO_API_KEY || "",
      "Content-Type": "application/json",
    };

    const response = await fetch(`${process.env.DAIMO_API_URL}/payment/${id}`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to fetch payment data: ${response.statusText}`,
      };
    }

    const paymentData = (await response.json()) as RozoPayOrderView;

    return {
      success: true,
      payment: paymentData,
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

  console.log(loaderData)
  if (!loaderData.success) {
    return redirect("/error");
  }

  return <CheckoutContent loaderData={loaderData} />;
}
