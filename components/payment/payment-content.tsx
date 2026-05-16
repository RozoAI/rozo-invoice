"use client";

import { Button } from "@/components/ui/button";
import {
  NewPaymentResponse,
  PaymentResponse,
  PaymentStatus,
} from "@/lib/payment-api";
import { getPaymentAmount } from "@/lib/utils";
import {
  PaymentCompletedEvent,
  type RozoPayOrderView,
} from "@rozoai/intent-common";
import { RozoPayButton } from "@rozoai/intent-pay";
import {
  AlertCircle,
  BadgeCheckIcon,
  ClockFading,
  ExternalLink,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactElement } from "react";
import { toast } from "sonner";
import ChainsStacked from "../chains-stacked";

export interface PaymentContentProps {
  appId: string;
  data: RozoPayOrderView | PaymentResponse | NewPaymentResponse;
}

/**
 * PaymentContent component to display payment information and pay button
 */
export function PaymentContent({ data }: PaymentContentProps): ReactElement {
  const [payment, _] = useState(data);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const router = useRouter();

  const paymentAmount = useMemo(() => {
    return getPaymentAmount(payment);
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

  const isMerchant = useMemo(() => {
    return (
      (payment.metadata &&
        "appId" in payment.metadata &&
        payment.metadata.appId.includes("MP")) ||
      ((payment as PaymentResponse)?.isMerchant ?? false)
    );
  }, [payment]);

  const paymentStatus = useMemo(() => {
    const status = payment.status as PaymentStatus;

    if (status === PaymentStatus.PaymentUnpaid) return "Payment Unpaid";
    if (status === PaymentStatus.PaymentExpired) return "Payment Expired";

    if (
      [
        PaymentStatus.PaymentErrorLiquidity,
        PaymentStatus.PaymentErrorRecipientTrustline,
      ].includes(status)
    ) {
      return "Payment Unavailable";
    }

    if (status === PaymentStatus.PaymentBounced) return "Payment Bounced";
    if (status === PaymentStatus.PaymentRefunded) return "Payment Refunded";

    const completedStatuses = [
      PaymentStatus.PaymentCompleted,
      PaymentStatus.PaymentStarted,
      PaymentStatus.PaymentPayinCompleted,
      PaymentStatus.PaymentPayoutCompleted,
      PaymentStatus.PaymentPayoutStarted,
      PaymentStatus.PaymentBridging,
      PaymentStatus.PaymentBridgingHook,
    ];

    if (isMerchant && completedStatuses.includes(status)) {
      return "Payment Completed";
    }

    if (
      [
        PaymentStatus.PaymentPayoutCompleted,
        PaymentStatus.PaymentCompleted,
      ].includes(status)
    ) {
      return "Payment Completed";
    }

    return "Payment in Progress";
  }, [payment.status, isMerchant]);

  const renderStatusIcon = useMemo(() => {
    if (paymentStatus === "Payment Expired") {
      return <ClockFading className="size-[65px] text-neutral-400" />;
    }

    if (
      paymentStatus === "Payment Bounced" ||
      paymentStatus === "Payment Unavailable"
    ) {
      return <AlertCircle className="size-[90px] text-neutral-400" />;
    }

    if (
      paymentStatus === "Payment Unpaid" ||
      paymentStatus === "Payment in Progress"
    ) {
      return null;
    }

    return <BadgeCheckIcon className="size-[90px] fill-[#0052FF] text-white" />;
  }, [paymentStatus]);

  const paymentDescription = useMemo(() => {
    if (paymentStatus === "Payment Bounced") {
      return "Payment bounced due to invalid recipient address. Please contact support.";
    }

    if (paymentStatus === "Payment Unavailable") {
      return "Payment unavailable due to insufficient liquidity. Please contact support.";
    }

    return null;
  }, [paymentStatus]);

  return (
    <div className="flex w-full flex-1 flex-col items-center justify-center gap-4 md:justify-start">
      <div className="flex flex-col items-center">
        {renderStatusIcon}

        {payment.status !== "payment_unpaid" && (
          <div className="text-center max-w-md">
            <h3 className="font-semibold text-xl">{paymentStatus}</h3>
            {paymentDescription && paymentStatus !== "Payment Bounced" && (
              <p className="text-muted-foreground text-xs">
                {paymentDescription}
              </p>
            )}
            {paymentStatus === "Payment Bounced" && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We&apos;ve received your payment, but the payout failed.
                  Don&apos;t worry. The payout will be processed again within 24
                  hours.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Price Display */}
      <div className="py-4">
        <div className="font-bold text-5xl text-foreground">
          {paymentAmount}
        </div>
      </div>

      {paymentStatus === "Payment Completed" && (
        <Button size={"sm"} asChild>
          <Link href={`/receipt?id=${payment.id}`} rel="noopener noreferrer">
            <ExternalLink size={14} />
            View Receipt
          </Link>
        </Button>
      )}

      {/* Items Section */}
      {paymentItems && paymentItems.length > 0 && (
        <div className="w-full space-y-3">
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
      {payment.status === "payment_unpaid" && (
        <>
          <RozoPayButton.Custom
            defaultOpen
            closeOnSuccess
            resetOnSuccess
            payId={payment.id}
            onPaymentStarted={() => {
              setIsLoading(true);
              router.prefetch(`/receipt?id=${payment.id}`);
            }}
            onPaymentBounced={() => {
              setIsLoading(false);
            }}
            onPaymentCompleted={(payment: PaymentCompletedEvent) => {
              setPaymentCompleted(true);
              toast.success(`Payment completed for $${paymentAmount}`);
              const params = new URLSearchParams({
                id: payment.rozoPaymentId ?? "",
                isCompletedForMerchant: String(isMerchant),
                payerAddress: payment.payerAddress ?? "",
                payInHash:
                  payment.txHash ?? payment.payment.destination.txHash ?? "",
              });
              router.replace(`/receipt?${params}`);
              setIsLoading(false);
            }}
            onClose={() => {
              setIsLoading(false);
            }}
          >
            {({ show }) => (
              <Button
                variant="default"
                className="w-full cursor-pointer py-6 font-semibold text-base"
                onClick={show}
                disabled={isLoading || paymentCompleted}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "Pay with Crypto"
                )}
              </Button>
            )}
          </RozoPayButton.Custom>

          <ChainsStacked />
        </>
      )}
    </div>
  );
}
