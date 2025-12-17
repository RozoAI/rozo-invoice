import { Receipt } from "@/components/payment/receipt/receipt";
import {
  getMissingParamsMessage,
  getUnknownErrorMessage,
  redirectToError,
} from "@/lib/error-utils";
import {
  generateErrorMetadata,
  generatePaymentMetadata,
} from "@/lib/metadata-utils";
import { getPaymentData } from "@/lib/payment-api";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

interface ReceiptPageProps {
  searchParams: Promise<{ id?: string; payInHash?: string; back_url?: string }>;
}

export async function generateMetadata({
  searchParams,
}: ReceiptPageProps): Promise<Metadata> {
  try {
    const { id, payInHash } = await searchParams;

    if (!id && !payInHash) {
      return generateErrorMetadata();
    }

    // Use id if available, otherwise use payInHash
    const identifier = id || payInHash!;
    const isHash = !id && !!payInHash;
    const isMugglePay = identifier.includes("mugglepay_order");
    const result = await getPaymentData(identifier, isHash, isMugglePay);

    if (!result.success || !result.payment) {
      return generateErrorMetadata();
    }

    return generatePaymentMetadata(result.payment);
  } catch (error) {
    console.error("Error generating metadata:", error);
    return generateErrorMetadata();
  }
}

export default async function ReceiptPage({ searchParams }: ReceiptPageProps) {
  try {
    const { id, back_url } = await searchParams;
    const isMugglePay = id?.includes("mugglepay_order");

    if (!id) {
      return redirectToError({
        type: "INVALID_REQUEST",
        source: "receipt",
        message: getMissingParamsMessage("receipt"),
      });
    }

    const result = await getPaymentData(id, false, isMugglePay);
    console.log("Payment data:", result);
    if (!result.success || !result.payment) {
      return redirectToError({
        type: "PAYMENT_NOT_FOUND",
        id,
      });
    }

    return <Receipt payment={result.payment} />;
  } catch (error) {
    // Re-throw Next.js redirect errors to avoid double redirect
    if (
      error instanceof Error &&
      (error.message === "NEXT_REDIRECT" ||
        (error as any).digest?.startsWith("NEXT_REDIRECT"))
    ) {
      throw error;
    }

    console.error("Error loading receipt:", error);
    return redirectToError({
      type: "API_ERROR",
      source: "receipt",
      message: getUnknownErrorMessage(error, "receipt"),
    });
  }
}
