"use client";

import { chainToLogo } from "@/components/icons/chains";
import { Ring } from "@/components/icons/loader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useExplorer } from "@/hooks/use-explorer";
import { useShareReceipt } from "@/hooks/use-share-receipt";
import {
  NewPaymentResponse,
  PaymentResponse,
  PaymentStatus as PaymentStatusEnum,
} from "@/lib/payment-api";
import { formatAddress } from "@/lib/utils";
import { RozoPayOrderView, getChainName } from "@rozoai/intent-common";
import { format } from "date-fns";
import {
  AlertCircle,
  ArrowRight,
  BadgeCheckIcon,
  ClockFading,
  Copy,
  ExternalLinkIcon,
  MessageCircle,
  Share2,
} from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";
import { EmailInput } from "./email-input";

interface ReceiptProps {
  payment: RozoPayOrderView | PaymentResponse | NewPaymentResponse;
  supportEmail?: string;
  supportUrl?: string;
  onDownload?: () => void;
}

interface StatusConfig {
  bgColor: string;
  borderColor: string;
  color: string;
  label: string;
  description: string;
  descriptionColor: string;
  icon: React.ReactNode;
}

export function Receipt({
  payment,
  supportEmail = "help@rozo.ai",
  supportUrl = "https://discord.com/invite/EfWejgTbuU",
  onDownload,
}: ReceiptProps) {
  const { shareReceipt } = useShareReceipt(payment);
  const { openExplorer } = useExplorer();

  // Get status configuration
  const getStatusConfig = (): StatusConfig => {
    const status = payment.status;

    if (
      status === PaymentStatusEnum.PaymentCompleted ||
      status === PaymentStatusEnum.PaymentPayoutCompleted
    ) {
      return {
        bgColor: "bg-green-50 dark:bg-green-950/20",
        borderColor: "border-green-200 dark:border-green-800",
        color: "text-green-700 dark:text-green-400",
        label: "Payment Completed",
        description:
          "Your payment has been successfully processed and completed.",
        descriptionColor: "text-green-700 dark:text-green-400",
        icon: (
          <BadgeCheckIcon className="size-10 text-green-700 dark:text-green-400" />
        ),
      };
    }

    if (
      status === PaymentStatusEnum.PaymentPayinCompleted ||
      status === PaymentStatusEnum.PaymentPayoutStarted
    ) {
      return {
        bgColor: "bg-blue-50 dark:bg-blue-950/20",
        borderColor: "border-blue-200 dark:border-blue-800",
        color: "text-blue-700 dark:text-blue-400",
        label: "Payment in Progress",
        description:
          "Your payment is being processed. Please wait a few moments.",
        descriptionColor: "text-blue-700 dark:text-blue-400",
        icon: <Ring width={50} height={50} className="text-[#0052FF]" />,
      };
    }

    if (status === PaymentStatusEnum.PaymentExpired) {
      return {
        bgColor: "bg-gray-50 dark:bg-gray-950/20",
        borderColor: "border-gray-200 dark:border-gray-800",
        color: "text-gray-700 dark:text-gray-400",
        label: "Payment Expired",
        description:
          "This payment request has expired. Please initiate a new payment.",
        descriptionColor: "text-gray-700 dark:text-gray-400",
        icon: (
          <ClockFading className="size-10 text-gray-700 dark:text-gray-400" />
        ),
      };
    }

    if (
      status === PaymentStatusEnum.PaymentErrorLiquidity ||
      status === PaymentStatusEnum.PaymentErrorRecipientTrustline
    ) {
      return {
        bgColor: "bg-red-50 dark:bg-red-950/20",
        borderColor: "border-red-200 dark:border-red-800",
        color: "text-red-700 dark:text-red-400",
        label: "Payment Failed",
        description:
          "We couldn't complete your payment. Please contact our support team for assistance.",
        descriptionColor: "text-red-700 dark:text-red-400",
        icon: (
          <AlertCircle className="size-10 text-red-700 dark:text-red-400" />
        ),
      };
    }

    if (status === PaymentStatusEnum.PaymentBounced) {
      return {
        bgColor: "bg-neutral-200/50 dark:bg-neutral-950/50",
        borderColor: "border-neutral-300 dark:border-neutral-800",
        color: "text-neutral-800 dark:text-neutral-400",
        label: "Payment Bounced",
        description:
          "Payment bounced due to invalid recipient address. Please contact support.",
        descriptionColor: "text-neutral-700 dark:text-neutral-400",
        icon: (
          <AlertCircle className="size-10 text-neutral-700 dark:text-neutral-400" />
        ),
      };
    }

    if (status === PaymentStatusEnum.PaymentUnpaid) {
      return {
        bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
        borderColor: "border-yellow-200 dark:border-yellow-800",
        color: "text-yellow-700 dark:text-yellow-400",
        label: "Payment Unpaid",
        description: "This payment is still awaiting completion.",
        descriptionColor: "text-yellow-700 dark:text-yellow-400",
        icon: (
          <ClockFading className="size-10 text-yellow-700 dark:text-yellow-400" />
        ),
      };
    }

    // Default
    return {
      bgColor: "bg-gray-50 dark:bg-gray-950/20",
      borderColor: "border-gray-200 dark:border-gray-800",
      color: "text-gray-700 dark:text-gray-400",
      label: "Payment Pending",
      description: "Your payment is being prepared. Waiting for confirmation.",
      descriptionColor: "text-gray-700 dark:text-gray-400",
      icon: (
        <ClockFading className="size-10 text-gray-700 dark:text-gray-400" />
      ),
    };
  };

  // Get payment amount
  const getPaymentAmount = (): number => {
    if (
      "display" in payment &&
      "paymentValue" in payment.display &&
      payment.display.paymentValue
    ) {
      return parseFloat(payment.display.paymentValue);
    }
    if (
      "destination" in payment &&
      "amountUnits" in payment.destination &&
      payment.destination.amountUnits
    ) {
      return parseFloat(payment.destination.amountUnits);
    }
    if (
      "source" in payment &&
      payment.source &&
      "amount" in payment.source &&
      payment.source.amount
    ) {
      return parseFloat(payment.source.amount);
    }
    if (
      "destination" in payment &&
      "amount" in payment.destination &&
      payment.destination.amount
    ) {
      return parseFloat(payment.destination.amount);
    }
    return 0;
  };

  // Get currency
  const getCurrency = (): string => {
    if (
      "display" in payment &&
      "currency" in payment.display &&
      payment.display.currency
    ) {
      return payment.display.currency;
    }
    if (
      "destination" in payment &&
      "tokenSymbol" in payment.destination &&
      payment.destination.tokenSymbol
    ) {
      return payment.destination.tokenSymbol;
    }
    if (
      "source" in payment &&
      payment.source &&
      "tokenSymbol" in payment.source &&
      payment.source.tokenSymbol
    ) {
      return payment.source.tokenSymbol;
    }
    return "USD";
  };

  // Get fee
  const getFee = (): number => {
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
            return data.fee;
          }
        }
      }
    }
    if (
      "source" in payment &&
      payment.source &&
      "fee" in payment.source &&
      payment.source.fee
    ) {
      const fee = payment.source.fee;
      return typeof fee === "string" ? parseFloat(fee) : fee;
    }
    return 0;
  };

  // Get from wallet
  const getFromWallet = (): string => {
    if (
      "source" in payment &&
      payment.source &&
      "senderAddress" in payment.source &&
      payment.source.senderAddress
    ) {
      return payment.source.senderAddress;
    }
    if (
      "source" in payment &&
      payment.source &&
      "payerAddress" in payment.source &&
      payment.source.payerAddress
    ) {
      return payment.source.payerAddress;
    }
    if ("payerAddress" in payment && typeof payment.payerAddress === "string") {
      return payment.payerAddress;
    }
    return "";
  };

  // Get source transaction hash
  const getFromSourceTxHash = useMemo(() => {
    if (payment?.source?.txHash) {
      return payment.source.txHash;
    }

    if ("payinTransactionHash" in payment && payment.payinTransactionHash) {
      return payment.payinTransactionHash;
    }
    return "";
  }, [payment]);

  // Get to wallet
  const getToWallet = (): string => {
    if (
      "destination" in payment &&
      "destinationAddress" in payment.destination &&
      payment.destination.destinationAddress
    ) {
      return payment.destination.destinationAddress;
    }
    if (
      "destination" in payment &&
      "receiverAddress" in payment.destination &&
      payment.destination.receiverAddress
    ) {
      return payment.destination.receiverAddress;
    }
    if ("receivingAddress" in payment && payment.receivingAddress) {
      return payment.receivingAddress;
    }
    return "";
  };

  // Get destination transaction hash
  const getDestinationTxHash = useMemo(() => {
    if (
      payment?.destination &&
      "txHash" in payment.destination &&
      payment.destination.txHash
    ) {
      return payment.destination.txHash;
    }

    if ("payoutTransactionHash" in payment && payment.payoutTransactionHash) {
      return payment.payoutTransactionHash;
    }
    return "";
  }, [payment]);

  // Get from chain
  const getFromChain = (): number | null => {
    if (
      "source" in payment &&
      payment.source &&
      "chainId" in payment.source &&
      payment.source.chainId
    ) {
      return Number(payment.source.chainId);
    }
    if ("payinchainid" in payment && payment.payinchainid) {
      return Number(payment.payinchainid);
    }
    if (
      "metadata" in payment &&
      payment.metadata &&
      "preferred_chain" in payment.metadata &&
      payment.metadata.preferred_chain
    ) {
      return Number(payment.metadata.preferred_chain);
    }
    return null;
  };

  // Get to chain
  const getToChain = (): number | null => {
    if (
      "destination" in payment &&
      "chainId" in payment.destination &&
      payment.destination.chainId
    ) {
      return Number(payment.destination.chainId);
    }
    return null;
  };

  // Get date
  const getDate = (): Date => {
    if (
      payment.status === "payment_completed" ||
      payment.status === "payment_payout_completed"
    ) {
      if (
        "metadata" in payment &&
        payment.metadata &&
        "forwarder_processed_at" in payment.metadata &&
        payment.metadata.forwarder_processed_at
      ) {
        const date = payment.metadata.forwarder_processed_at;
        return new Date(
          typeof date === "string" && isNaN(Number(date))
            ? date
            : Number(date) * 1000
        );
      }
    }
    if ("createdAt" in payment && payment.createdAt) {
      const date = payment.createdAt;
      return new Date(
        typeof date === "string" && isNaN(Number(date))
          ? date
          : Number(date) * 1000
      );
    }
    return new Date();
  };

  const config = useMemo(() => getStatusConfig(), [payment.status]);
  const amount = useMemo(() => getPaymentAmount(), [payment]);
  const currency = useMemo(() => getCurrency(), [payment]);
  const fee = useMemo(() => getFee(), [payment]);
  const totalAmount = useMemo(() => amount + fee, [amount, fee]);
  const fromWallet = useMemo(() => getFromWallet(), [payment]);
  const toWallet = useMemo(() => getToWallet(), [payment]);
  const fromChain = useMemo(() => getFromChain(), [payment]);
  const toChain = useMemo(() => getToChain(), [payment]);
  const date = useMemo(() => getDate(), [payment]);

  const fromChainLogo = useMemo(() => {
    let chainId: number | null = null;

    if (
      "source" in payment &&
      payment.source &&
      "chainId" in payment.source &&
      payment.source.chainId
    ) {
      chainId = Number(payment.source.chainId);
    }

    if ("payinchainid" in payment && payment.payinchainid) {
      chainId = Number(payment.payinchainid);
    }

    if (
      "metadata" in payment &&
      payment.metadata &&
      "preferred_chain" in payment.metadata &&
      payment.metadata.preferred_chain
    ) {
      chainId = Number(payment.metadata.preferred_chain);
    }

    if (chainId) {
      return chainToLogo({ chainId, size: 14 }) ?? null;
    }

    return null;
  }, [payment]);

  const toChainLogo = useMemo(() => {
    let chainId: number | null = null;
    if (
      "destination" in payment &&
      payment.destination &&
      "chainId" in payment.destination &&
      payment.destination.chainId
    ) {
      chainId = Number(payment.destination.chainId);
    }

    if (chainId) {
      return chainToLogo({ chainId, size: 14 }) ?? null;
    }

    return null;
  }, [payment]);

  const paymentItems = useMemo(() => {
    if ("metadata" in payment && payment.metadata?.items) {
      const items = payment.metadata.items;
      return Array.isArray(items) ? items : null;
    }

    return null;
  }, [payment]);

  const StatusIcon = () => config.icon;

  return (
    <Card className="w-full max-w-lg overflow-hidden shadow-none sm:shadow-lg rounded-none sm:rounded-lg py-0">
      {/* Status Banner */}
      <div
        className={`${config.bgColor} ${config.borderColor} border-b-2 px-6 py-4`}
      >
        <div className="flex flex-col items-center gap-3 justify-center">
          <StatusIcon />
          <div className="flex-1 text-center">
            <h2 className={`${config.color} font-semibold text-lg`}>
              {config.label}
            </h2>
            <p className={`text-sm ${config.descriptionColor} mb-2`}>
              {config.description}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-6 space-y-4 sm:space-y-6">
        {/* Amount Section */}
        <div className="text-center pb-4 border-b">
          <p className="text-sm text-muted-foreground mb-2">Total Amount</p>
          <div>
            <span className="text-5xl font-bold tracking-tight">
              {amount.toFixed(2)}
            </span>
            <span className="text-2xl text-muted-foreground font-medium ml-2">
              {currency}
            </span>
          </div>
        </div>

        {/* Transaction Flow */}
        <div className="flex flex-col gap-4">
          {paymentItems && paymentItems.length > 0 && (
            <>
              <div className="flex-1 bg-muted/50 rounded-lg p-4 hover:bg-muted/80 transition-colors text-center">
                {paymentItems.map((item, index: number) => (
                  <>
                    <div
                      key={`${item.name}-${index}`}
                      className="text-sm font-medium"
                    >
                      {item.name}
                    </div>
                    <div
                      key={`${item.description}-${index}`}
                      className="text-xs"
                    >
                      {item.description}
                    </div>
                  </>
                ))}
              </div>
            </>
          )}

          <div className="flex items-center sm:gap-3 gap-2">
            {/* From */}
            <div className="flex-1 bg-muted/50 rounded-lg p-4 hover:bg-muted/80 transition-colors">
              <div className="flex justify-between">
                <p className="text-xs text-muted-foreground mb-1">From (You)</p>

                {(getFromSourceTxHash || fromWallet) && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ExternalLinkIcon
                        className="size-3 cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() =>
                          openExplorer({
                            chainId: String(fromChain),
                            hash: getFromSourceTxHash,
                            address: fromWallet,
                          })
                        }
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <span>View on Explorer</span>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-mono text-sm sm:text-base font-medium">
                  {formatAddress(fromWallet)}
                </span>
                <Copy
                  className="size-3 cursor-pointer text-muted-foreground hover:text-foreground transition-colors ml-auto"
                  onClick={() => {
                    navigator.clipboard.writeText(fromWallet);
                    toast.success("Address copied to clipboard");
                  }}
                />
              </div>

              <div className="flex items-center gap-1.5 text-sm font-medium">
                <div className="size-4">{fromChainLogo}</div>
                {fromChain ? getChainName(fromChain) : "Unknown"}
              </div>
            </div>

            {/* Arrow */}
            <div className="shrink-0">
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>

            {/* To */}
            <div className="flex-1 bg-muted/50 rounded-lg p-4 hover:bg-muted/80 transition-colors">
              <div className="flex justify-between">
                <p className="text-xs text-muted-foreground mb-1">To</p>

                {(getDestinationTxHash || toWallet) && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ExternalLinkIcon
                        className="size-3 cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() =>
                          openExplorer({
                            chainId: String(toChain),
                            hash: getDestinationTxHash,
                            address: toWallet,
                          })
                        }
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <span>View on Explorer</span>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-mono text-sm sm:text-base font-medium">
                  {formatAddress(toWallet)}
                </span>
                <Copy
                  className="size-3 cursor-pointer text-muted-foreground hover:text-foreground transition-colors ml-auto"
                  onClick={() => {
                    navigator.clipboard.writeText(toWallet);
                    toast.success("Address copied to clipboard");
                  }}
                />
              </div>
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-medium">
                <div className="size-4">{toChainLogo}</div>
                {toChain ? getChainName(toChain) : "Unknown"}
              </div>
            </div>
          </div>
        </div>

        {/* Breakdown */}
        <div className="space-y-3 pt-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Date</span>
            <span className="font-medium">
              {format(date, "MMMM d, yyyy 'at' h:mm a")}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Payment Amount</span>
            <span className="font-medium">
              {amount.toFixed(2)} {currency}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Transaction Fee</span>
            <span className="font-medium">
              {fee.toFixed(2)} {currency}
            </span>
          </div>
          <div className="border-t pt-3 flex justify-between">
            <span className="font-semibold">Total</span>
            <span className="font-semibold text-lg">
              {totalAmount.toFixed(2)} {currency}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col md:flex-row gap-3 w-full md:items-end">
          <EmailInput paymentId={payment.id} />
          <Button className="gap-2 flex-1" onClick={shareReceipt}>
            <Share2 className="h-4 w-4" />
            Share Receipt
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-muted/30 px-4 sm:px-6 py-4 border-t text-center text-sm text-muted-foreground flex items-center gap-2">
        Need help? Contact us:
        <div className="flex gap-4 flex-1 justify-end">
          <a
            href="https://x.com/rozoai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground font-medium hover:underline"
          >
            <svg
              className="size-4"
              xmlns="http://www.w3.org/2000/svg"
              width="1em"
              height="1em"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="M10.488 14.651L15.25 21h7l-7.858-10.478L20.93 3h-2.65l-5.117 5.886L8.75 3h-7l7.51 10.015L2.32 21h2.65zM16.25 19L5.75 5h2l10.5 14z"
              ></path>
            </svg>
          </a>
          <a
            href="https://discord.com/invite/EfWejgTbuU"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground font-medium hover:underline"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.019 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1568 2.4189Z" />
            </svg>
          </a>
          <a
            href="https://t.me/shawnmuggle"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground font-medium hover:underline"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
            </svg>
          </a>
          <button
            type="button"
            className="text-foreground font-medium hover:underline cursor-pointer"
            onClick={() =>
              window.Intercom(
                "showNewMessage",
                "Hi, I need help with my payment."
              )
            }
          >
            <MessageCircle className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Card>
  );
}
