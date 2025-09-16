"use client";

import { Button } from "@/components/ui/button";
import { PaymentResponse } from "@/lib/payment-api";
import {
  baseUSDC,
  getChainExplorerTxUrl,
  rozoSolana,
  rozoStellar,
  solana,
  stellar,
  type PaymentCompletedEvent,
  type RozoPayOrderView,
} from "@rozoai/intent-common";
import { RozoPayButton, useRozoPayUI } from "@rozoai/intent-pay";
import {
  CircleCheckIcon,
  CircleXIcon,
  ExternalLink,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactElement } from "react";
import { toast } from "sonner";

export interface PaymentContentProps {
  appId: string;
  data: RozoPayOrderView | PaymentResponse;
}

interface PayParams {
  toAddress: `0x${string}`;
  toChain: number;
  toUnits: string;
  toToken: `0x${string}`;
  toStellarAddress?: string;
  toSolanaAddress?: string;
}

/**
 * PaymentContent component to display payment information and pay button
 */
export function PaymentContent({
  appId,
  data,
}: PaymentContentProps): ReactElement {
  const [payment, _] = useState(data);
  const [payParams, setPayParams] = useState<PayParams | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { resetPayment } = useRozoPayUI();

  const isToStellar = useMemo(() => {
    return (
      payment.destination.chainId === String(stellar.chainId) ||
      payment.destination.chainId === String(rozoStellar.chainId)
    );
  }, [payment.destination]);

  const isToSolana = useMemo(() => {
    return (
      payment.destination.chainId === String(solana.chainId) ||
      payment.destination.chainId === String(rozoSolana.chainId)
    );
  }, [payment.destination]);

  const paymentAmount = useMemo(() => {
    if (
      "display" in payment &&
      "paymentValue" in payment.display &&
      "currency" in payment.display
    ) {
      // RozoPayOrderView
      const amount = parseFloat(payment.display.paymentValue);
      return `$${amount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    } else if (
      "destination" in payment &&
      "amountUnits" in payment.destination
    ) {
      // PaymentResponse
      const amount = parseFloat(payment.destination.amountUnits);
      return `$${amount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
    return "Amount unavailable";
  }, [payment]);

  const paymentItems = useMemo(() => {
    // Check for items in metadata (PaymentResponse)
    if ("metadata" in payment && payment.metadata?.items) {
      const items = payment.metadata.items;
      // Ensure items is an array
      return Array.isArray(items) ? items : null;
    }
    // Could add support for RozoPayOrderView items here if needed
    return null;
  }, [payment]);

  const txUrl = useMemo(() => {
    if (!("txHash" in payment.destination) || !payment.destination.txHash)
      return undefined;

    return getChainExplorerTxUrl(
      Number(payment.destination.chainId),
      payment.destination.txHash
    );
  }, [payment.destination]);

  useEffect(() => {
    const validAddress = "0x0000000000000000000000000000000000000000";

    let params = {};

    if (isToStellar) {
      params = {
        toAddress: validAddress,
        toChain: baseUSDC.chainId,
        toToken: baseUSDC.token,
        toUnits: payment.destination.amountUnits,
        toStellarAddress: payment.destination.destinationAddress,
      };
    } else if (isToSolana) {
      params = {
        toAddress: validAddress,
        toChain: baseUSDC.chainId,
        toToken: baseUSDC.token,
        toUnits: payment.destination.amountUnits,
        toSolanaAddress: payment.destination.destinationAddress,
      };
    } else {
      params = {
        toAddress: payment.destination.destinationAddress,
        toChain: Number(payment.destination.chainId),
        toToken: payment.destination.tokenAddress as `0x${string}`,
        toUnits: payment.destination.amountUnits,
      };
    }

    setPayParams(params as PayParams);
    resetPayment(params);
  }, [isToStellar, isToSolana, payment]);

  console.log({ isToStellar, isToSolana, payment });

  return (
    <div className="flex w-full flex-1 flex-col items-center justify-center gap-4 md:justify-start">
      {/* Price Display */}
      <div className="py-4">
        <div className="font-bold text-5xl text-foreground">
          {paymentAmount}
        </div>
      </div>

      {/* Items Section */}
      {paymentItems && paymentItems.length > 0 && (
        <div className="w-full space-y-3">
          <div className="font-medium text-foreground text-center">Items</div>
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
      {payParams && payment.status === "payment_unpaid" && (
        <RozoPayButton.Custom
          defaultOpen
          appId={appId}
          toAddress={payParams.toAddress as `0x${string}`}
          toChain={payParams.toChain as number}
          toUnits={payParams.toUnits as string}
          toToken={payParams.toToken as `0x${string}`}
          externalId={payment.externalId ?? undefined}
          onPaymentStarted={() => {
            setIsLoading(true);
          }}
          onPaymentBounced={() => {
            setIsLoading(false);
          }}
          onPaymentCompleted={(args: PaymentCompletedEvent) => {
            setIsLoading(false);
            toast.success(`Payment completed for $${payParams.toUnits}`);
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
      {payment.status === "payment_expired" && (
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-1">
            <CircleXIcon className="size-8 fill-red-600 text-white" />
            <span className="font-semibold text-red-600">Payment Expired</span>
          </div>
        </div>
      )}
    </div>
  );
}
