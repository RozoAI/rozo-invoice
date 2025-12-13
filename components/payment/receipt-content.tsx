"use client";

import BoxedCard from "@/components/boxed-card";
import { CardContent, CardFooter } from "@/components/ui/card";
import { usePollPayout } from "@/hooks/use-poll-payout";
import { usePusherPayout } from "@/hooks/use-pusher-payout";
import { useShareReceipt } from "@/hooks/use-share-receipt";
import { NewPaymentResponse, PaymentResponse } from "@/lib/payment-api";
import { RozoPayOrderView } from "@rozoai/intent-common";
import { useMemo } from "react";
import { ContactSupport } from "../contact-support";
import { PaymentStatus } from "./receipt/payment-status";
import { ReceiptActions } from "./receipt/receipt-actions";
import { TransactionFlow } from "./receipt/transaction-flow";

export default function ReceiptContent({
  payment,
  backUrl,
  enablePolling = false,
  enablePusher = true,
}: {
  payment: RozoPayOrderView | PaymentResponse | NewPaymentResponse;
  backUrl?: string;
  enablePolling?: boolean;
  enablePusher?: boolean;
}) {
  const { currentPayment: pusherPayment, shouldFallbackToPolling } =
    usePusherPayout(payment, enablePusher);
  // Enable polling if Pusher fallback is triggered or explicitly enabled
  const effectivePolling = enablePolling || shouldFallbackToPolling;
  const { currentPayment: polledPayment } = usePollPayout(
    enablePusher ? pusherPayment : payment,
    effectivePolling
  );
  // Use pusher payment if enabled, otherwise use polled payment or original payment
  const currentPayment = enablePusher
    ? pusherPayment
    : effectivePolling
    ? polledPayment
    : payment;
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

  return (
    <BoxedCard className="flex-1">
      <CardContent className="flex flex-1 flex-col items-center gap-8 px-4 py-0 text-center">
        {/* <ViewTypeToggle viewType={viewType} onViewTypeChange={setViewType} /> */}

        <PaymentStatus payment={currentPayment} />

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
            <TransactionFlow payment={currentPayment} />
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
