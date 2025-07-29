import { RozoPayOrderView, getChainName } from "@rozoai/intent-common";
import { formatDistanceToNow } from "date-fns";
import { BadgeCheckIcon } from "lucide-react";

interface PaymentStatusProps {
  payment: RozoPayOrderView;
  viewType: "user" | "merchant";
}

export function PaymentStatus({ payment, viewType }: PaymentStatusProps) {
  const getChainInfo = () => {
    if (viewType === "user" && payment?.source) {
      return payment.source.chainId === "10001"
        ? "Stellar"
        : getChainName(Number(payment.source.chainId));
    }
    if (viewType === "merchant" && payment?.destination) {
      return payment.destination.chainId === "10001"
        ? "Stellar"
        : getChainName(Number(payment.destination.chainId));
    }
    return "Unknown";
  };

  const shouldShowChainInfo =
    (viewType === "user" && payment?.source) ||
    (viewType === "merchant" && payment?.destination);

  return (
    <div className="flex flex-col items-center w-full">
      <BadgeCheckIcon className="size-[90px] fill-[#0052FF] text-white" />
      <div className="space-y-1 mt-2">
        <h3 className="font-semibold text-xl">
          {viewType === "user" ? "Payment Completed" : "Payment Received"}
        </h3>
      </div>

      <div className="mt-6">
        <h2 className="font-bold text-4xl">
          {payment?.display.paymentValue} {payment?.display.currency}
        </h2>
        {shouldShowChainInfo && (
          <span className="text-muted-foreground text-xs">
            on {getChainInfo()} &bull;{" "}
            {viewType === "user" ? "Sent" : "Received"}{" "}
            {formatDistanceToNow(new Date(Number(payment?.createdAt) * 1000), {
              addSuffix: true,
            })}
          </span>
        )}
      </div>
    </div>
  );
}
