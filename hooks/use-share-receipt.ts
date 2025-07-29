import { RozoPayOrderView } from "@rozoai/intent-common";
import { useCallback } from "react";

export function useShareReceipt(payment: RozoPayOrderView) {
  const shareReceipt = useCallback(async () => {
    if (!payment) return;
    const url = window.location.href;
    const title = `Payment Receipt - ${payment.display.paymentValue} ${payment.display.currency}`;
    const text = `Check out this payment receipt for ${payment.display.paymentValue} ${payment.display.currency}`;

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
