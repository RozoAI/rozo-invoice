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

    // Stop polling if payout hash or completed status already exists
    if (
      "payoutTransactionHash" in currentPayment &&
      currentPayment.payoutTransactionHash
    )
      return;

    if (
      "destination" in currentPayment &&
      currentPayment.destination &&
      "txHash" in currentPayment.destination &&
      currentPayment.destination.txHash
    ) {
      return;
    }

    if (
      currentPayment.status === "payment_completed" ||
      currentPayment.status === "payment_payout_completed"
    ) {
      return;
    }

    let cancelled = false;
    setIsPolling(true);

    const poll = async () => {
      try {
        const result = await pollPaymentUntilPayoutClient(
          currentPayment.id,
          10_000,
          6
        );
        if (cancelled) return;

        if (result.success && result.payment) {
          setCurrentPayment(result.payment);
        }

        setIsPolling(false);
      } catch (error) {
        if (!cancelled) {
          console.error("Polling failed:", error);
          // Retry after delay
          setTimeout(() => !cancelled && poll(), 10_000);
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

