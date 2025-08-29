import { RozoPayOrderView } from "@rozoai/intent-common";
import { Metadata } from "next";
import { PaymentResponse } from "./payment-api";

export function generatePaymentMetadata(
  payment: RozoPayOrderView | PaymentResponse
): Metadata {
  let title: string;
  let description: string;

  if (
    "display" in payment &&
    "paymentValue" in payment.display &&
    "currency" in payment.display
  ) {
    // RozoPayOrderView
    title = `Payment Receipt - ${payment.display.paymentValue} ${payment.display.currency}`;
    description = `Check out this payment receipt for ${payment.display.paymentValue} ${payment.display.currency}`;
  } else if ("display" in payment && "name" in payment.display) {
    // PaymentResponse
    title = `Payment Receipt - ${payment.display.name}`;
    description = `Check out this payment receipt for ${payment.display.description}`;
  } else {
    // Fallback
    title = "Payment Receipt";
    description = "Check out this payment receipt";
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export function generateErrorMetadata(): Metadata {
  return {
    title: "Payment Receipt - Error",
    description:
      "Unable to load payment receipt. Please check the payment ID and try again.",
  };
}
