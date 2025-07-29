"use client";

import { Button } from "@/components/ui/button";
import {
  getChainExplorerTxUrl,
  type PaymentCompletedEvent,
  type RozoPayOrderView,
} from "@rozoai/intent-common";
import { RozoPayButton } from "@rozoai/intent-pay";
import { CircleCheckIcon, ExternalLink, Loader2 } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { useMemo, useState, type ReactElement } from "react";

export interface PaymentContentProps {
  appId: string;
  data: RozoPayOrderView;
}

/**
 * PaymentContent component to display payment information and pay button
 */
export function PaymentContent({
  appId,
  data,
}: PaymentContentProps): ReactElement {
  const [payment, setPayment] = useState(data);
  const [isLoading, setIsLoading] = useState(false);

  const txUrl = useMemo(() => {
    if (!payment.destination.txHash) return undefined;
    return getChainExplorerTxUrl(
      Number(payment.destination.chainId),
      payment.destination.txHash
    );
  }, [payment.destination.chainId, payment.destination.txHash]);

  return (
    <div className="flex w-full flex-1 flex-col items-center justify-center gap-8 md:justify-start">
      {/* Price Display */}
      <div className="py-4">
        <div className="font-bold text-5xl text-foreground">
          {payment.display.paymentValue} {payment.display.currency}
        </div>
      </div>

      {/* Order Information */}
      {payment.externalId && (
        <div className="space-y-1">
          <div className="font-medium text-foreground">Order Number</div>
          <div className="font-mono text-muted-foreground text-sm">
            {payment.externalId}
          </div>
        </div>
      )}

      {/* Pay Button */}
      {payment.status === "payment_unpaid" && (
        <RozoPayButton.Custom
          defaultOpen
          closeOnSuccess
          resetOnSuccess
          appId={appId}
          toAddress={payment.destination.destinationAddress as `0x${string}`}
          toChain={Number(payment.destination.chainId)}
          toUnits={payment.destination.amountUnits}
          toToken={payment.destination.tokenAddress as `0x${string}`}
          externalId={payment.externalId ?? undefined}
          onPaymentStarted={() => {
            setIsLoading(true);
          }}
          onPaymentBounced={() => {
            setIsLoading(false);
          }}
          onPaymentCompleted={(args: PaymentCompletedEvent) => {
            setIsLoading(false);
            redirect(
              `/receipt?id=${args.payment.externalId ?? args.paymentId}`
            );
          }}
        >
          {({ show }) => (
            <Button
              variant="default"
              className="w-full cursor-pointer py-6 font-semibold text-base"
              onClick={show}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Pay with Crypto"
              )}
            </Button>
          )}
        </RozoPayButton.Custom>
      )}
      {payment.status === "payment_completed" && (
        <div className="flex flex-col items-center gap-2 ">
          <div className="flex items-center gap-1">
            <CircleCheckIcon className="size-8 fill-green-600 text-white" />
            <span className="font-semibold text-green-600">
              Payment Completed
            </span>
          </div>
          {txUrl && (
            <Link
              href={txUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-muted-foreground text-sm underline hover:text-foreground"
            >
              <ExternalLink size={14} />
              View Transaction
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
