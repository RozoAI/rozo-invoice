import { Ring } from "@/components/icons/loader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  NewPaymentResponse,
  PaymentResponse,
  PaymentStatus as PaymentStatusEnum,
} from "@/lib/payment-api";
import {
  RozoPayOrderView,
  getChainName,
  rozoStellar,
  stellar,
} from "@rozoai/intent-common";
import { format, formatDistanceToNow } from "date-fns";
import {
  AlertCircle,
  BadgeAlertIcon,
  BadgeCheckIcon,
  ClockFading,
} from "lucide-react";
import { useMemo } from "react";

interface PaymentStatusProps {
  payment: RozoPayOrderView | PaymentResponse | NewPaymentResponse;
}

export function PaymentStatus({ payment }: PaymentStatusProps) {
  const getChainInfo = () => {
    if (payment.source) {
      return getChainName(Number(payment.source.chainId));
    }

    if ("payinchainid" in payment && payment.payinchainid) {
      return getChainName(Number(payment.payinchainid));
    }

    if (
      "metadata" in payment &&
      payment.metadata &&
      "preferred_chain" in payment.metadata
    ) {
      return getChainName(Number(payment.metadata.preferred_chain));
    }

    return "Unknown";
  };

  const shouldShowChainInfo = useMemo(() => {
    return (
      payment?.source ||
      ("payinchainid" in payment && payment.payinchainid) ||
      ("metadata" in payment &&
        payment.metadata &&
        "preferred_chain" in payment.metadata)
    );
  }, [payment]);

  const getCurrencySymbol = useMemo(() => {
    let currency = "USD";

    if ("display" in payment && "currency" in payment.display) {
      currency = payment.display.currency;
    }

    return currency === "EUR" ? "€" : "$";
  }, [payment]);

  const getPaymentAmount = () => {
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
    }

    if ("destination" in payment && "amountUnits" in payment.destination) {
      // PaymentResponse
      const amount = parseFloat(payment.destination.amountUnits);
      return `${getCurrencySymbol}${amount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }

    if ("source" in payment && payment.source && "amount" in payment.source) {
      // RozoPayOrderView
      const amount = parseFloat(payment.source.amount ?? "0");
      return `${getCurrencySymbol}${amount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }

    return "Amount unavailable";
  };

  const isMugglePay = useMemo(() => {
    return (
      payment.metadata &&
      "appId" in payment.metadata &&
      payment.metadata.appId.includes("MP")
    );
  }, [payment.metadata]);

  const isErrorStatus = useMemo(() => {
    return (
      payment.status === "payment_error_liquidity" ||
      payment.status === "payment_error_recipient_trustline"
    );
  }, [payment.status]);

  const errorMessage = useMemo(() => {
    if (isErrorStatus && "message" in payment && payment.message) {
      return payment.message;
    }
    return null;
  }, [isErrorStatus, payment]);

  const paidDate = useMemo(() => {
    if (payment.status === "payment_completed") {
      if (payment.metadata && "forwarder_processed_at" in payment.metadata) {
        return payment.metadata.forwarder_processed_at;
      }
    }

    return payment.createdAt;
  }, [payment.status, payment.createdAt, payment.metadata]);

  const getFormattedDate = (date: string | number | null) => {
    if (!date) return "";
    const dateObj = new Date(isNaN(Number(date)) ? date : Number(date) * 1000);
    return format(dateObj, "PPpp"); // e.g., "Jan 1, 2024 at 12:00:00 PM"
  };

  const feeInfo = useMemo(() => {
    if ("metadata" in payment && payment.metadata) {
      const metadata = payment.metadata as Record<string, unknown>;
      if (
        "provider_response" in metadata &&
        metadata.provider_response &&
        typeof metadata.provider_response === "object"
      ) {
        const providerResponse = metadata.provider_response as Record<
          string,
          unknown
        >;
        if (
          "data" in providerResponse &&
          providerResponse.data &&
          typeof providerResponse.data === "object"
        ) {
          const data = providerResponse.data as Record<string, unknown>;
          if ("fee" in data && typeof data.fee === "number") {
            return data.fee === 0
              ? "Free"
              : `${getCurrencySymbol}${data.fee.toFixed(2)}`;
          }
        }
      }
    }

    if ("source" in payment && payment.source) {
      const source = payment.source as Record<string, unknown>;
      if ("fee" in source) {
        const fee = source.fee as string;
        return fee === "0" ? "Free" : `${getCurrencySymbol}${fee}`;
      }
    }
    return null;
  }, [payment]);

  const paymentStatus = useMemo(() => {
    const { status } = payment;

    if (status === "payment_unpaid") {
      return "Payment Unpaid";
    }

    if (status === "payment_expired") return "Payment Expired";

    if (
      status === PaymentStatusEnum.PaymentErrorLiquidity ||
      status === PaymentStatusEnum.PaymentErrorRecipientTrustline
    ) {
      return "Payment Unavailable";
    }

    if (status === PaymentStatusEnum.PaymentBounced) {
      return "Payment Bounced";
    }

    if (status === PaymentStatusEnum.PaymentRefunded) {
      return "Payment Refunded";
    }

    if (
      status === PaymentStatusEnum.PaymentPayinCompleted ||
      status === PaymentStatusEnum.PaymentPayoutStarted ||
      status === PaymentStatusEnum.PaymentBridging ||
      status === PaymentStatusEnum.PaymentBridgingHook
    ) {
      return "Payment in Progress";
    }

    // We force the payment to be completed if it is a MugglePay payment
    if (
      (status === PaymentStatusEnum.PaymentCompleted ||
        status === PaymentStatusEnum.PaymentStarted ||
        status === PaymentStatusEnum.PaymentPayinCompleted ||
        status === PaymentStatusEnum.PaymentPayoutCompleted ||
        status === PaymentStatusEnum.PaymentPayoutStarted ||
        status === PaymentStatusEnum.PaymentBridging ||
        status === PaymentStatusEnum.PaymentBridgingHook) &&
      isMugglePay
    ) {
      return "Payment Completed";
    }

    if (
      status === PaymentStatusEnum.PaymentPayoutCompleted ||
      status === PaymentStatusEnum.PaymentCompleted
    ) {
      return "Payment Completed";
    }

    return "Payment in Progress";
  }, [payment, isMugglePay]);

  const renderStatusIcon = useMemo(() => {
    if (paymentStatus === "Payment Expired") {
      return <ClockFading className="size-[65px] text-neutral-400" />;
    }

    if (paymentStatus === "Payment Unavailable") {
      return <AlertCircle className="size-[90px] text-neutral-400" />;
    }

    if (paymentStatus === "Payment Bounced") {
      return <AlertCircle className="size-[90px] text-neutral-400" />;
    }

    if (paymentStatus === "Payment Unpaid") {
      return (
        <BadgeAlertIcon className="size-[90px] fill-yellow-500 text-white" />
      );
    }

    if (paymentStatus === "Payment in Progress") {
      return <Ring width={65} height={65} className="text-[#0052FF]" />;
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

  const isStellarPayoutWithGAddress = useMemo(() => {
    if (paymentStatus !== "Payment Bounced") return false;

    // Check if destination exists and has chainId
    if (
      "destination" in payment &&
      payment.destination &&
      "chainId" in payment.destination
    ) {
      const chainId = String(payment.destination.chainId);
      const isStellar =
        chainId === String(stellar.chainId) ||
        chainId === String(rozoStellar.chainId);

      if (isStellar) {
        // Check if address starts with G
        const address =
          ("receiverAddress" in payment.destination &&
            payment.destination.receiverAddress) ||
          ("destinationAddress" in payment.destination &&
            payment.destination.destinationAddress) ||
          "";

        return address.startsWith("G");
      }
    }

    return false;
  }, [paymentStatus, payment]);

  return (
    <div className="flex flex-col items-center w-full">
      {renderStatusIcon}

      <div className="space-y-3 mt-2 text-center max-w-md">
        <h3 className="font-semibold text-xl">{paymentStatus}</h3>
        {paymentDescription && paymentStatus !== "Payment Bounced" && (
          <p className="text-muted-foreground text-xs">{paymentDescription}</p>
        )}
        {paymentStatus === "Payment Bounced" && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground leading-relaxed">
              We&apos;ve received your payment, but the payout failed.
              Don&apos;t worry. The payout will be processed again within 24
              hours.
            </p>
            {isStellarPayoutWithGAddress && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Note:</span> Since your payout
                  is on Stellar and your address starts with G, please check if
                  you have enabled the USDC trustline for your account.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {errorMessage && (
        <Alert variant="destructive" className="mt-4 max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="col-start-2">
            {errorMessage}
          </AlertDescription>
        </Alert>
      )}

      <div className="mt-6">
        <h2 className="font-bold text-4xl">{getPaymentAmount()}</h2>
        {feeInfo && (
          <div className="text-muted-foreground text-sm mt-1">
            Fee: {feeInfo}
          </div>
        )}
        {shouldShowChainInfo && (
          <span className="text-muted-foreground text-xs">
            on {getChainInfo()} &bull;{" "}
            {payment.status === "payment_completed" ? (
              <>
                <span>Sent </span>
              </>
            ) : (
              "Created at "
            )}
            <Tooltip useTouch>
              <TooltipTrigger asChild>
                <span className="cursor-help underline decoration-dotted">
                  {formatDistanceToNow(
                    new Date(
                      isNaN(Number(paidDate))
                        ? paidDate || ""
                        : Number(paidDate) * 1000
                    ),
                    {
                      addSuffix: true,
                    }
                  )}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{getFormattedDate(paidDate)}</p>
              </TooltipContent>
            </Tooltip>
          </span>
        )}
      </div>
    </div>
  );
}
