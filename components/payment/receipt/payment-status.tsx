import { Ring } from "@/components/icons/loader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { NewPaymentResponse, PaymentResponse } from "@/lib/payment-api";
import { RozoPayOrderView, getChainName } from "@rozoai/intent-common";
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
  viewType: "user" | "merchant";
}

export function PaymentStatus({ payment, viewType }: PaymentStatusProps) {
  const getChainInfo = () => {
    if (viewType === "user" && payment.source) {
      return payment.source.chainId === "10001" ||
        payment.source.chainId === "1500"
        ? "Stellar"
        : getChainName(Number(payment.source.chainId));
    }

    if (
      viewType === "user" &&
      "payinchainid" in payment &&
      payment.payinchainid
    ) {
      return payment.payinchainid === "10001" || payment.payinchainid === "1500"
        ? "Stellar"
        : getChainName(Number(payment.payinchainid));
    }

    if (
      viewType === "user" &&
      "metadata" in payment &&
      payment.metadata &&
      "preferred_chain" in payment.metadata
    ) {
      return getChainName(Number(payment.metadata.preferred_chain));
    }

    if (viewType === "merchant" && payment?.destination) {
      return payment.destination.chainId === "10001" ||
        payment.destination.chainId === "1500"
        ? "Stellar"
        : getChainName(Number(payment.destination.chainId));
    }

    return "Unknown";
  };

  const shouldShowChainInfo =
    (viewType === "user" &&
      (payment?.source ||
        ("payinchainid" in payment && payment.payinchainid) ||
        ("metadata" in payment &&
          payment.metadata &&
          "preferred_chain" in payment.metadata))) ||
    (viewType === "merchant" && payment?.destination);

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
    } else if (
      "source" in payment &&
      payment.source &&
      "amount" in payment.source
    ) {
      // RozoPayOrderView
      const amount = parseFloat(payment.source.amount ?? "0");
      return `$${amount.toLocaleString("en-US", {
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

  const getFeeInfo = () => {
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
            return data.fee === 0 ? "Free" : `$${data.fee.toFixed(2)}`;
          }
        }
      }
    }

    if ("source" in payment && payment.source) {
      const source = payment.source as Record<string, unknown>;
      if ("fee" in source) {
        const fee = source.fee as string;
        return fee === "0" ? "Free" : `$${fee}`;
      }
    }
    return null;
  };

  const feeInfo = getFeeInfo();

  const paymentStatus = useMemo(() => {
    const { status } = payment;

    if (status === "payment_unpaid") {
      return "Payment Unpaid";
    }

    if (status === "payment_expired") return "Payment Expired";

    if (
      status === "payment_error_liquidity" ||
      status === "payment_error_recipient_trustline"
    ) {
      return "Payment Unavailable";
    }

    if (
      status === "payment_payin_completed" ||
      status === "payment_payout_started"
    ) {
      return "Payment in Progress";
    }

    if (status === "payment_completed" && isMugglePay) {
      return "Payment Completed";
    }

    if (
      status === "payment_completed" ||
      status === "payment_payout_completed"
    ) {
      const hasPayoutHash =
        ("payoutTransactionHash" in payment && payment.payoutTransactionHash) ||
        ("destination" in payment &&
          payment.destination &&
          "txHash" in payment.destination &&
          payment.destination.txHash);

      if (!hasPayoutHash) return "Payment in Progress";
    }

    return viewType === "user" ? "Payment Completed" : "Payment Received";
  }, [payment, viewType, isMugglePay]);

  const renderStatusIcon = useMemo(() => {
    if (paymentStatus === "Payment Expired") {
      return <ClockFading className="size-[65px] text-neutral-400" />;
    }

    if (paymentStatus === "Payment Unavailable") {
      return <AlertCircle className="size-[90px] text-red-500" />;
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

  return (
    <div className="flex flex-col items-center w-full">
      {renderStatusIcon}

      <div className="space-y-1 mt-2">
        <h3 className="font-semibold text-xl">{paymentStatus}</h3>
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
                <span>{viewType === "user" ? "Sent" : "Received"} </span>
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
