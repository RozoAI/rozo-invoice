import { NewPaymentResponse, PaymentResponse } from "@/lib/payment-api";
import { RozoPayOrderView } from "@rozoai/intent-common";
import { useCallback } from "react";

export function useShareReceipt(
  payment: RozoPayOrderView | PaymentResponse | NewPaymentResponse
) {
  const shareReceipt = useCallback(async () => {
    if (!payment) return;
    const url = window.location.href;
    let title: string;
    let text: string;

    if (
      "display" in payment &&
      "paymentValue" in payment.display &&
      "currency" in payment.display
    ) {
      // RozoPayOrderView
      title = `Payment Receipt - ${payment.display.paymentValue} ${payment.display.currency}`;
      text = `Check out this payment receipt for ${payment.display.paymentValue} ${payment.display.currency}`;
    } else if ("display" in payment && "name" in payment.display) {
      // PaymentResponse
      title = `Payment Receipt - $${payment.destination.amountUnits}`;
      text = `Check out this payment receipt for ${payment.display.description}`;
    } else {
      // Fallback
      title = "Payment Receipt";
      text = "Check out this payment receipt";
    }

    // Check if Web Share API is supported
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url,
        });
      } catch (error) {
        // User cancelled or error occurred
        console.log("Share cancelled or failed:", error);
      }
    } else {
      // Fallback: Copy URL to clipboard
      try {
        await navigator.clipboard.writeText(url);
        // You could add a toast notification here
        // alert("Receipt URL copied to clipboard!");
      } catch (error) {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        // alert("Receipt URL copied to clipboard!");
      }
    }
  }, [payment]);

  return { shareReceipt };
}
