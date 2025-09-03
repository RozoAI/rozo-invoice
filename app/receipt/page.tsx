import ReceiptContent from "@/components/payment/receipt-content";
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

    const result = await getPaymentData(identifier, isHash);

    if (!result.success || !result.payment) {
      return generateErrorMetadata();
    }

    return generatePaymentMetadata(result.payment);
  } catch (error) {
    console.error("Error generating metadata:", error);
    return generateErrorMetadata();
  }
}

export default async function Receipt({ searchParams }: ReceiptPageProps) {
  try {
    const { id, payInHash, back_url } = await searchParams;

    if (!id && !payInHash) {
      return redirectToError({
        type: "INVALID_REQUEST",
        source: "receipt",
        message: getMissingParamsMessage("receipt"),
      });
    }

    // Use id if available, otherwise use payInHash
    const identifier = id || payInHash!;
    const isHash = !id && !!payInHash;

    const result = await getPaymentData(identifier, isHash);
    console.log("Payment data:", result);
    if (!result.success || !result.payment) {
      return redirectToError({
        type: "PAYMENT_NOT_FOUND",
        id: identifier,
      });
    }

    return <ReceiptContent payment={result.payment} backUrl={back_url} />;
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
