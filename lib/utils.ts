import { NewPaymentResponse, PaymentResponse } from "@/lib/payment-api";
import { RozoPayOrderView, TokenSymbol } from "@rozoai/intent-common";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const formatPaymentAmount = (
  rawAmount: string,
  currencyCode: "USD" | "EUR" = "USD",
) => {
  const amount = parseFloat(rawAmount);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAddress(address: string) {
  return address.slice(0, 6) + "..." + address.slice(-4);
}

export function getPaymentAmount(
  payment: RozoPayOrderView | PaymentResponse | NewPaymentResponse,
) {
  if (
    "display" in payment &&
    "paymentValue" in payment.display &&
    "currency" in payment.display
  ) {
    // RozoPayOrderView
    const currencyCode = payment.display.currency === "EUR" ? "EUR" : "USD";
    return formatPaymentAmount(payment.display.paymentValue, currencyCode);
  } else if ("destination" in payment && "amountUnits" in payment.destination) {
    // PaymentResponse
    const currencyCode =
      "tokenSymbol" in payment.destination &&
      payment.destination.tokenSymbol === TokenSymbol.EURC
        ? "EUR"
        : "USD";
    return formatPaymentAmount(payment.destination.amountUnits, currencyCode);
  } else if (
    "source" in payment &&
    payment.source &&
    "amount" in payment.source
  ) {
    // NewPaymentResponse
    const currencyCode =
      "tokenSymbol" in payment.source &&
      payment.source.tokenSymbol === TokenSymbol.EURC
        ? "EUR"
        : "USD";
    return formatPaymentAmount(payment.source.amount as string, currencyCode);
  }
  return "Amount unavailable";
}
