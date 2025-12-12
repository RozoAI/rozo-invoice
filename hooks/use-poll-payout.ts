import {
  NewPaymentResponse,
  PaymentResponse,
  pollPaymentUntilPayoutClient,
} from "@/lib/payment-api";
import { RozoPayOrderView } from "@rozoai/intent-common";
import { useEffect, useState } from "react";

export function usePollPayout(
  payment: RozoPayOrderView | PaymentResponse | NewPaymentResponse,
  enabled: boolean = true
) {
  const [currentPayment, setCurrentPayment] = useState<
    RozoPayOrderView | PaymentResponse | NewPaymentResponse
  >(payment);
  const [isPolling, setIsPolling] = useState(false);

  // Sync currentPayment with payment prop changes
  useEffect(() => {
    setCurrentPayment(payment);
  }, [payment]);

  // Start polling if no destination hash exists (payoutTransactionHash or destination.txHash)
  useEffect(() => {
    if (!enabled) return;
    if (!currentPayment?.id) return;

    // Stop polling if payout hash already exists
    if (
      "payoutTransactionHash" in currentPayment &&
      currentPayment.payoutTransactionHash
    )
      return;

    let cancelled = false;
    setIsPolling(true);

    const poll = async () => {
      try {
        const result = await pollPaymentUntilPayoutClient(
          currentPayment.id,
          1000
        );
        if (cancelled) return;

        if (result.success && result.payment) {
          setCurrentPayment(result.payment);

          // Stop polling when payout hash appears
          if (
            ("payoutTransactionHash" in result.payment &&
              result.payment.payoutTransactionHash) ||
            ("destination" in result.payment &&
              result.payment.destination &&
              "txHash" in result.payment.destination &&
              result.payment.destination.txHash) ||
            result.payment.status === "payment_completed" ||
            result.payment.status === "payment_payout_completed"
          ) {
            setIsPolling(false);
            return;
          }

          // Continue polling recursively
          poll();
        } else {
          // Retry even if not successful
          poll();
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Polling failed:", error);
          // Retry after delay if desired
          setTimeout(() => !cancelled && poll(), 2000);
        }
      }
    };

    poll();

    return () => {
      cancelled = true;
      setIsPolling(false);
    };
  }, [currentPayment?.id, enabled]);

  return { currentPayment, isPolling };
}

