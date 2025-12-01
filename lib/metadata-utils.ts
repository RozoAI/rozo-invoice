import { RozoPayOrderView } from "@rozoai/intent-common";
import { Metadata } from "next";
import { NewPaymentResponse, PaymentResponse } from "./payment-api";

export function generatePaymentMetadata(
  payment: RozoPayOrderView | PaymentResponse | NewPaymentResponse
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

function getPaymentAmount(
  payment: RozoPayOrderView | PaymentResponse | NewPaymentResponse
): string {
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

  if ("source" in payment && payment.source && "amount" in payment.source) {
    const amount = parseFloat(payment.source.amount ?? "0");
    return `$${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  return "Payment";
}
