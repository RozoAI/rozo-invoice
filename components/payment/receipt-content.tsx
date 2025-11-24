"use client";

import BoxedCard from "@/components/boxed-card";
import { CardContent, CardFooter } from "@/components/ui/card";
import { useExplorer } from "@/hooks/use-explorer";
import { useShareReceipt } from "@/hooks/use-share-receipt";
import {
  PaymentResponse,
  pollPaymentUntilPayoutClient,
} from "@/lib/payment-api";
import { RozoPayOrderView } from "@rozoai/intent-common";
import { useEffect, useMemo, useState } from "react";
import { ContactSupport } from "../contact-support";
import { PaymentStatus } from "./receipt/payment-status";
import { ReceiptActions } from "./receipt/receipt-actions";
import { TransactionFlow } from "./receipt/transaction-flow";

export default function ReceiptContent({
  payment,
  backUrl,
}: {
  payment: RozoPayOrderView | PaymentResponse;
  backUrl?: string;
}) {
  const [viewType, setViewType] = useState<"user" | "merchant">("user");
  const [showMoreActions, setShowMoreActions] = useState(true);
  const [currentPayment, setCurrentPayment] = useState<
    RozoPayOrderView | PaymentResponse
  >(payment);
  const [isPolling, setIsPolling] = useState(false);

  const { openExplorer } = useExplorer();
  const { shareReceipt } = useShareReceipt(currentPayment);

  // Helper to safely get payment items
  const paymentItems = useMemo(() => {
    // Check for items in metadata (PaymentResponse)
    if ("metadata" in currentPayment && currentPayment.metadata?.items) {
      const items = currentPayment.metadata.items;
      // Ensure items is an array
      return Array.isArray(items) ? items : null;
    }
    // Could add support for RozoPayOrderView items here if needed
    return null;
  }, [currentPayment]);

  // Sync currentPayment with payment prop changes
  useEffect(() => {
    setCurrentPayment(payment);
  }, [payment]);

  // Start polling if no destination hash exists (payoutTransactionHash or destination.txHash)
  useEffect(() => {
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
            "payoutTransactionHash" in result.payment &&
            result.payment.payoutTransactionHash
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
  }, [currentPayment?.id]);

  return (
    <BoxedCard className="flex-1">
      <CardContent className="flex flex-1 flex-col items-center gap-8 px-4 py-0 text-center">
        {/* <ViewTypeToggle viewType={viewType} onViewTypeChange={setViewType} /> */}

        <PaymentStatus payment={currentPayment} viewType={viewType} />

        {(currentPayment?.source && currentPayment?.destination) ||
        ("destination" in currentPayment && currentPayment.destination) ? (
          <>
            {/* Items Section */}
            {paymentItems && paymentItems.length > 0 && (
              <div className="w-full space-y-3 max-w-[350px]">
                <div className="space-y-2">
                  {paymentItems.map((item, index: number) => (
                    <div
                      key={index}
                      className="flex flex-col space-y-1 rounded-lg border bg-muted/30 p-3"
                    >
                      <div className="font-medium text-foreground text-sm">
                        {item.name}
                      </div>
                      {item.description && (
                        <div className="text-muted-foreground text-xs">
                          {item.description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <TransactionFlow
              payment={currentPayment}
              viewType={viewType}
              onExplorerClick={openExplorer}
            />
          </>
        ) : null}

        <ReceiptActions onShare={shareReceipt} />
      </CardContent>

      <CardFooter className="pb-0 flex flex-col gap-4 mx-auto">
        <ContactSupport />
      </CardFooter>
    </BoxedCard>
  );
}
