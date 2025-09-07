import { PaymentResponse } from "@/lib/payment-api";
import { RozoPayOrderView, getChainName } from "@rozoai/intent-common";
import { formatDistanceToNow } from "date-fns";
import { BadgeAlertIcon, BadgeCheckIcon } from "lucide-react";
import { useMemo } from "react";

interface PaymentStatusProps {
  payment: RozoPayOrderView | PaymentResponse;
  viewType: "user" | "merchant";
}

export function PaymentStatus({ payment, viewType }: PaymentStatusProps) {
  const getChainInfo = () => {
    if (viewType === "user" && payment?.source) {
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
        ("payinchainid" in payment && payment.payinchainid))) ||
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

  const getPaymentStatus = useMemo(() => {
    if (payment.status === "payment_unpaid") {
      return "Payment in Progress";
    }
    return viewType === "user" ? "Payment Completed" : "Payment Received";
  }, [payment.status, viewType]);

  return (
    <div className="flex flex-col items-center w-full">
      {payment.status === "payment_unpaid" ? (
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
            {viewType === "user" ? "Sent" : "Received"}{" "}
            {formatDistanceToNow(
              new Date(
                isNaN(Number(payment?.createdAt))
                  ? payment?.createdAt || ""
                  : Number(payment?.createdAt) * 1000
              ),
              {
                addSuffix: true,
              }
            )}
          </span>
        )}
      </div>
    </div>
  );
}
