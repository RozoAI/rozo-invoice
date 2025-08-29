import { RozoPayOrderView } from "@rozoai/intent-common";
import { Metadata } from "next";
import { PaymentResponse } from "./payment-api";

export function generatePaymentMetadata(
  payment: RozoPayOrderView | PaymentResponse
): Metadata {
  const amount = getPaymentAmount(payment);
  const title = `Payment Receipt - ${amount}`;
  const description = `Payment confirmation for ${amount}`;

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
      "Unable to load payment receipt. Please verify the payment ID.",
  };
}

function getPaymentAmount(payment: RozoPayOrderView | PaymentResponse): string {
  if (
    "display" in payment &&
    "paymentValue" in payment.display &&
    "currency" in payment.display
  ) {
    const amount = parseFloat(payment.display.paymentValue);
    return `$${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  if ("destination" in payment && "amountUnits" in payment.destination) {
    const amount = parseFloat(payment.destination.amountUnits);
    return `$${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  return "Payment";
}
