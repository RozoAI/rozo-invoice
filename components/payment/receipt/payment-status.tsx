import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PaymentResponse } from "@/lib/payment-api";
import { RozoPayOrderView, getChainName } from "@rozoai/intent-common";
import { format, formatDistanceToNow } from "date-fns";
import { BadgeAlertIcon, BadgeCheckIcon, BadgeXIcon } from "lucide-react";
import { useMemo } from "react";

interface PaymentStatusProps {
  payment: RozoPayOrderView | PaymentResponse;
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
      viewType == "user" &&
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

  const getPaymentStatus = useMemo(() => {
    if (payment.status === "payment_unpaid" && !isMugglePay) {
      return "Payment in Progress";
    }

    if (payment.status === "payment_expired") {
      return "Payment Expired";
    }

    return viewType === "user" ? "Payment Completed" : "Payment Received";
  }, [payment.status, viewType, isMugglePay]);

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

  return (
    <div className="flex flex-col items-center w-full">
      {payment.status === "payment_expired" ? (
        <BadgeXIcon className="size-[90px] fill-red-600 text-white" />
      ) : payment.status === "payment_unpaid" && !isMugglePay ? (
        <BadgeAlertIcon className="size-[90px] fill-yellow-500 text-white" />
      ) : (
        <BadgeCheckIcon className="size-[90px] fill-[#0052FF] text-white" />
      )}

      <div className="space-y-1 mt-2">
        <h3 className="font-semibold text-xl">{getPaymentStatus}</h3>
      </div>

      <div className="mt-6">
        <h2 className="font-bold text-4xl">{getPaymentAmount()}</h2>
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
