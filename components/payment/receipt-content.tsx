"use client";

import BoxedCard from "@/components/boxed-card";
import { CardContent } from "@/components/ui/card";
import { useExplorer } from "@/hooks/use-explorer";
import { useShareReceipt } from "@/hooks/use-share-receipt";
import {
  PaymentResponse,
  pollPaymentUntilPayoutClient,
} from "@/lib/payment-api";
import { RozoPayOrderView } from "@rozoai/intent-common";
import { useEffect, useState } from "react";
import { PaymentStatus } from "./receipt/payment-status";
import { ReceiptActions } from "./receipt/receipt-actions";
import { TransactionFlow } from "./receipt/transaction-flow";
import { ViewTypeToggle } from "./receipt/view-type-toggle";

export default function ReceiptContent({
  payment,
  backUrl,
}: {
  payment: RozoPayOrderView | PaymentResponse;
  backUrl?: string;
}) {
  const [viewType, setViewType] = useState<"user" | "merchant">("user");
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [currentPayment, setCurrentPayment] = useState<
    RozoPayOrderView | PaymentResponse
  >(payment);
  const [isPolling, setIsPolling] = useState(false);

  const { openExplorer } = useExplorer();
  const { shareReceipt } = useShareReceipt(currentPayment);

  // Sync currentPayment with payment prop changes
  useEffect(() => {
    setCurrentPayment(payment);
  }, [payment]);

  // Start polling if no destination hash exists (payoutTransactionHash or destination.txHash)
  useEffect(() => {
    const hasPayoutHash =
      "payoutTransactionHash" in currentPayment &&
      currentPayment.payoutTransactionHash;
    const hasDestinationTxHash =
      currentPayment.destination &&
      "txHash" in currentPayment.destination &&
      currentPayment.destination.txHash;
    const hasAnyDestinationHash = hasPayoutHash || hasDestinationTxHash;
    let cancelled = false;

    if (!hasAnyDestinationHash && currentPayment.id && !isPolling) {
      setIsPolling(true);

      pollPaymentUntilPayoutClient(currentPayment.id)
        .then((result) => {
          if (!cancelled && result.success && result.payment) {
            setCurrentPayment(result.payment);
          }
        })
        .catch((error) => {
          if (!cancelled) {
            console.error("Polling failed:", error);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setIsPolling(false);
          }
        });
    }

    return () => {
      cancelled = true;
    };
  }, [currentPayment.id, isPolling]);

  return (
    <BoxedCard className="flex-1">
      <CardContent className="flex flex-1 flex-col items-center gap-8 px-4 py-0 text-center">
        <ViewTypeToggle viewType={viewType} onViewTypeChange={setViewType} />

        <PaymentStatus payment={currentPayment} viewType={viewType} />

        {showMoreActions &&
        ((currentPayment?.source && currentPayment?.destination) ||
          ("payinTransactionHash" in currentPayment &&
            "destination" in currentPayment &&
            currentPayment.payinTransactionHash &&
            currentPayment.destination)) ? (
          <TransactionFlow
            payment={currentPayment}
            viewType={viewType}
            onExplorerClick={openExplorer}
          />
        ) : null}

        <ReceiptActions
          showMoreActions={showMoreActions}
          onToggleActions={() => setShowMoreActions(!showMoreActions)}
          onShare={shareReceipt}
          backUrl={backUrl}
        />
      </CardContent>
    </BoxedCard>
  );
}
