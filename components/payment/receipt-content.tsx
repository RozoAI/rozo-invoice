"use client";

import BoxedCard from "@/components/boxed-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CardContent, CardFooter } from "@/components/ui/card";
import { usePollPayout } from "@/hooks/use-poll-payout";
import { usePusherPayout } from "@/hooks/use-pusher-payout";
import { useShareReceipt } from "@/hooks/use-share-receipt";
import { NewPaymentResponse, PaymentResponse } from "@/lib/payment-api";
import { RozoPayOrderView } from "@rozoai/intent-common";
import { useMemo } from "react";
import { ContactSupport } from "../contact-support";
import { EmailInput } from "./receipt/email-input";
import { PaymentStatus } from "./receipt/payment-status";
import { ReceiptActions } from "./receipt/receipt-actions";
import { TransactionFlow } from "./receipt/transaction-flow";

export default function ReceiptContent({
  payment,
  enablePolling = true,
  enablePusher = true,
  isCompletedForMerchant = false,
  payerAddress = null,
}: {
  payment: RozoPayOrderView | PaymentResponse | NewPaymentResponse;
  backUrl?: string;
  enablePolling?: boolean;
  enablePusher?: boolean;
  isCompletedForMerchant?: boolean;
  payerAddress?: string | null;
}) {
  const { currentPayment: pusherPayment, shouldFallbackToPolling } =
    usePusherPayout(payment, enablePusher);
  // Enable polling if Pusher fallback is triggered or explicitly enabled
  const effectivePolling = enablePolling || shouldFallbackToPolling;
  const { currentPayment: polledPayment } = usePollPayout(
    enablePusher ? pusherPayment : payment,
    effectivePolling,
  );
  // Use pusher payment if enabled, otherwise use polled payment or original payment
  const currentPayment = effectivePolling
    ? polledPayment
    : enablePusher
      ? pusherPayment
      : payment;
  const { shareReceipt } = useShareReceipt(currentPayment);

  const merchant = useMemo(() => {
    if ("merchant" in currentPayment && currentPayment.merchant) {
      return currentPayment.merchant as {
        name?: string;
        logoUrl?: string;
        description?: string;
      };
    }
    return null;
  }, [currentPayment]);

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
    <BoxedCard className="flex-1 py-0 sm:py-6">
      <CardContent className="flex flex-1 flex-col items-center gap-4 px-4 py-0 text-center">
        {/* <ViewTypeToggle viewType={viewType} onViewTypeChange={setViewType} /> */}

        {merchant && (
          <div className="flex justify-center items-center gap-2 border-b-2 border-dashed pb-4 w-full">
            <Avatar className="size-12 rounded-lg shadow-sm">
              <AvatarImage src={merchant.logoUrl} alt={merchant.name} />
              <AvatarFallback className="rounded-lg text-sm font-semibold">
                {merchant.name?.charAt(0) ?? "M"}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-0.5 text-left">
              <p className="font-semibold text-foreground">{merchant.name}</p>
              {merchant.description && (
                <p className="text-muted-foreground text-xs">
                  {merchant.description}
                </p>
              )}
            </div>
          </div>
        )}

        <PaymentStatus payment={currentPayment} isCompletedForMerchant />

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
              payerAddress={payerAddress}
            />
          </>
        ) : null}

        <ReceiptActions onShare={shareReceipt} />

        {currentPayment?.id && <EmailInput paymentId={currentPayment.id} />}
      </CardContent>

      <CardFooter className="pb-0 flex flex-col gap-4 mx-auto">
        <ContactSupport />
      </CardFooter>
    </BoxedCard>
  );
}
