"use client";

import { Button } from "@/components/ui/button";
import {
  DestinationResponse,
  FeeType,
  NewPaymentResponse,
  PaymentResponse,
  PaymentStatus,
  SourceResponse,
} from "@/lib/payment-api";
import {
  ExternalPaymentOptions,
  ExternalPaymentOptionsString,
  getKnownToken,
  rozoSolana,
  rozoStellar,
  Token,
  TokenSymbol,
  type RozoPayOrderView,
} from "@rozoai/intent-common";
import { RozoPayButton, useRozoPayUI } from "@rozoai/intent-pay";
import {
  AlertCircle,
  BadgeCheckIcon,
  ClockFading,
  ExternalLink,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactElement } from "react";
import { toast } from "sonner";

export interface PaymentContentProps {
  appId: string;
  data: RozoPayOrderView | PaymentResponse | NewPaymentResponse;
}

interface PayParams {
  toAddress: `0x${string}`;
  toChain: number;
  toUnits: string;
  toToken: `0x${string}`;
  toStellarAddress?: string;
  toSolanaAddress?: string;
  metadata?: Record<string, string>;
  feeType?: FeeType;
  preferredSymbol?: TokenSymbol[];
  preferredTokens?: Token[];
  paymentOptions?: ExternalPaymentOptionsString[];
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
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const router = useRouter();
  const { resetPayment } = useRozoPayUI();

  const preferredSymbol = useMemo(() => {
    if (
      (payment.source &&
        "tokenSymbol" in payment.source &&
        payment.source.tokenSymbol === TokenSymbol.EURC) ||
      (payment.display &&
        "currency" in payment.display &&
        payment.display.currency === "EUR")
    ) {
      return [TokenSymbol.EURC];
    }

    return [TokenSymbol.USDC, TokenSymbol.USDT];
  }, [payment.source, payment.display]);

  const formatPaymentAmount = (
    rawAmount: string,
    currencyCode: "USD" | "EUR" = "USD",
  ) => {
    const amount = parseFloat(rawAmount);
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const displayTitle = useMemo(() => {
    if (!payment) return null;

    const display = payment.display;

    if ("intent" in display && !!display.intent) {
      return display.intent;
    }

    if ("title" in display && !!display.title) {
      return display.title;
    }

    if (
      payment.metadata &&
      "intent" in payment.metadata &&
      !!payment.metadata.intent
    ) {
      return payment.metadata.intent;
    }

    return null;
  }, [payment]);

  const displayDescription = useMemo(() => {
    if (!payment) return null;

    const display = payment.display;

    if ("description" in display && !!display.description) {
      return display.description;
    }

    return null;
  }, [payment]);

  const paymentAmount = useMemo(() => {
    if (
      "display" in payment &&
      "paymentValue" in payment.display &&
      "currency" in payment.display
    ) {
      // RozoPayOrderView
      const currencyCode = payment.display.currency === "EUR" ? "EUR" : "USD";
      return formatPaymentAmount(payment.display.paymentValue, currencyCode);
    } else if (
      "destination" in payment &&
      "amountUnits" in payment.destination
    ) {
      // PaymentResponse
      const currencyCode =
        "tokenSymbol" in payment.destination &&
          payment.destination.tokenSymbol === TokenSymbol.EURC
          ? "EUR"
          : "USD";
      return formatPaymentAmount(payment.destination.amountUnits, currencyCode);
    } else if (
      "source" in payment &&
      payment.source &&
      "amount" in payment.source
    ) {
      // NewPaymentResponse
      const currencyCode =
        "tokenSymbol" in payment.source &&
          payment.source.tokenSymbol === TokenSymbol.EURC
          ? "EUR"
          : "USD";
      return formatPaymentAmount(payment.source.amount as string, currencyCode);
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

  const isMugglePay = useMemo(() => {
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

    if (isMugglePay && completedStatuses.includes(status)) {
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
  }, [payment.status, isMugglePay]);

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

  useEffect(() => {
    if (!payment.destination) {
      return;
    }

    const dest = payment.destination as DestinationResponse & {
      amountUnits?: string;
      destinationAddress?: string;
    };
    const toUnits =
      dest.amountUnits ||
      dest.amount ||
      ((payment.source as SourceResponse)?.amount as string);
    const toChain = Number(dest.chainId);
    const toAddress = dest.destinationAddress || dest.receiverAddress;
    const toToken = dest.tokenAddress;

    if (!payment.source?.chainId || !payment.source?.tokenAddress) {
      return;
    }
    const sourceChainId = Number(payment.source.chainId);
    const sourceToken = getKnownToken(
      sourceChainId,
      payment.source?.tokenAddress,
    );

    const paymentOptions: ExternalPaymentOptionsString[] = [];

    if (sourceChainId === rozoSolana.chainId) {
      paymentOptions.push(ExternalPaymentOptions.Solana);
    } else if (sourceChainId === rozoStellar.chainId) {
      paymentOptions.push(ExternalPaymentOptions.Stellar);
    } else {
      paymentOptions.push(ExternalPaymentOptions.Ethereum);
    }

    const params = {
      toChain,
      toUnits,
      toAddress,
      toToken,
      preferredSymbol,
      preferredTokens: sourceToken ?? undefined,
    };

    if ("type" in payment && payment.type) {
      Object.assign(params, {
        feeType: payment.type,
      });
    }

    if (paymentOptions.length > 0) {
      Object.assign(params, {
        paymentOptions: paymentOptions,
      });
    }

    if ("metadata" in payment && payment.metadata) {
      Object.assign(params, {
        ...params,
        metadata: {
          ...payment.metadata,
          customDeeplinkUrl: window.location.href,
        },
      });
    }

    resetPayment(params as PayParams);
    setPayParams(params as PayParams);
  }, [payment, preferredSymbol]);

  return (
    <div className="flex w-full flex-1 flex-col items-center justify-center gap-4 md:justify-start">
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

      {/* Price Display */}
      <div className="py-4">
        {displayTitle || displayDescription ? (
          <div className="mb-6">
            {displayTitle && (
              <h1 className="text-lg md:text-xl text-center font-semibold text-foreground">
                {displayTitle}
              </h1>
            )}
            {displayDescription && (
              <p className="text-sm md:text-base text-center text-muted-foreground">
                {displayDescription}
              </p>
            )}
          </div>
        ) : null}

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
      {payParams &&
        payment.status === "payment_unpaid" &&
        !paymentCompleted && (
          <>
            <RozoPayButton.Custom
              defaultOpen
              payId={payment.id}
              onPaymentStarted={() => {
                setIsLoading(true);
              }}
              onPaymentBounced={() => {
                setIsLoading(false);
              }}
              onPaymentCompleted={(args: any) => {
                setPaymentCompleted(true);
                toast.success(`Payment completed for $${payParams.toUnits}`);
                router.replace(`/receipt?id=${args.rozoPaymentId}`);
                setIsLoading(false);
              }}
              closeOnSuccess
              resetOnSuccess
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

            {/* <RozoPayButton.Custom
            defaultOpen
            appId={appId}
            toAddress={payParams.toAddress}
            toChain={payParams.toChain}
            toUnits={payParams.toUnits}
            toToken={payParams.toToken}
            externalId={payment.externalId ?? undefined}
            feeType={(payment as PaymentResponse).feeType}
            preferredSymbol={payParams.preferredSymbol}
            preferredTokens={payParams.preferredTokens}
            paymentOptions={payParams.paymentOptions}
            {...(payParams.metadata && {
              metadata: payParams.metadata as Record<string, string>,
            })}
            onPaymentStarted={() => {
              setIsLoading(true);
            }}
            onPaymentBounced={() => {
              setIsLoading(false);
            }}
            onPaymentCompleted={(args: any) => {
              setPaymentCompleted(true);
              toast.success(`Payment completed for $${payParams.toUnits}`);
              router.replace(`/receipt?id=${args.rozoPaymentId}`);
              setIsLoading(false);
            }}
            closeOnSuccess
            resetOnSuccess
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
          </RozoPayButton.Custom> */}
          </>
        )}
    </div>
  );
}
