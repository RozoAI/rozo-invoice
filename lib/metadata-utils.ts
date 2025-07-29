import { Metadata } from "next";
import { RozoPayOrderView } from "@rozoai/intent-common";

export function generatePaymentMetadata(payment: RozoPayOrderView): Metadata {
  const title = `Payment Receipt - ${payment.display.paymentValue} ${payment.display.currency}`;
  const description = `Check out this payment receipt for ${payment.display.paymentValue} ${payment.display.currency}`;

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
    description: "Unable to load payment receipt. Please check the payment ID and try again.",
  };
}
