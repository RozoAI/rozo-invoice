import { useExplorer } from "@/hooks/use-explorer";
import { NewPaymentResponse, PaymentResponse } from "@/lib/payment-api";
import { RozoPayOrderView } from "@rozoai/intent-common";
import { ArrowDown } from "lucide-react";
import { useMemo } from "react";
import { TransactionParticipant } from "./transaction-participant";

// Type guard to check if payment is PaymentResponse
function isPaymentResponse(
  payment: RozoPayOrderView | PaymentResponse | NewPaymentResponse
): payment is PaymentResponse {
  return "payinchainid" in payment;
}

// Type guard to check if payment has metadata with preferred_chain
function hasPreferredChain(
  payment: RozoPayOrderView | PaymentResponse | NewPaymentResponse
): boolean {
  return (
    "metadata" in payment &&
    payment.metadata !== null &&
    typeof payment.metadata === "object" &&
    "preferred_chain" in payment.metadata &&
    !!payment.metadata.preferred_chain
  );
}

interface TransactionFlowProps {
  payment: RozoPayOrderView | PaymentResponse | NewPaymentResponse;
}

export function TransactionFlow({ payment }: TransactionFlowProps) {
  const { openExplorer } = useExplorer();

  // Helper to safely get payer address
  const getSourcePayerAddress = (): string => {
    if (payment?.source?.payerAddress) {
      return payment.source.payerAddress;
    }

    if (
      "source" in payment &&
      payment.source &&
      "senderAddress" in payment.source &&
      payment.source.senderAddress
    ) {
      return payment.source.senderAddress;
    }

    if ("payerAddress" in payment && typeof payment.payerAddress === "string") {
      return payment.payerAddress;
    }
    return "";
  };

  // Helper to safely get source chain ID with proper fallback logic
  const getSourceChainId = (): string => {
    // First priority: source.chainId
    if (payment?.source?.chainId) {
      return payment.source.chainId.toString();
    }

    // Second priority: payinchainid (for PaymentResponse)
    if (isPaymentResponse(payment) && payment.payinchainid) {
      return payment.payinchainid;
    }

    // Third priority: metadata.preferred_chain
    if (hasPreferredChain(payment)) {
      const preferredChain = (payment.metadata as any).preferred_chain;
      if (typeof preferredChain === "string" && preferredChain) {
        return preferredChain;
      }
    }

    return "";
  };

  // Helper to safely get source transaction hash
  const getSourceTxHash = (): string => {
    if (payment?.source?.txHash) {
      return payment.source.txHash;
    }
    if (isPaymentResponse(payment) && payment.payinTransactionHash) {
      return payment.payinTransactionHash;
    }
    return "";
  };

  const getDestinationChainId = (): string => {
    if (payment?.destination?.chainId) {
      return payment.destination.chainId.toString();
    }
    return "";
  };

  // Helper to safely get destination transaction hash
  const getDestinationTxHash = (): string => {
    if (
      payment?.destination &&
      "txHash" in payment.destination &&
      payment.destination.txHash
    ) {
      return payment.destination.txHash;
    }
    if (isPaymentResponse(payment) && payment.payoutTransactionHash) {
      return payment.payoutTransactionHash;
    }
    return "";
  };

  const getDestinationAddress = (): string => {
    if (payment?.destination?.destinationAddress) {
      return payment.destination.destinationAddress;
    }

    if (
      "destination" in payment &&
      payment.destination &&
      "receiverAddress" in payment.destination &&
      payment.destination.receiverAddress
    ) {
      return payment.destination.receiverAddress;
    }
    return "";
  };

  const isForMerchant = useMemo(() => {
    return (
      payment?.metadata?.forMerchant ||
      (String(payment?.metadata?.appId) || "").includes("MP")
    );
  }, [payment]);

  const isPaymentCompleted = useMemo(() => {
    return (
      payment.status === "payment_completed" ||
      payment.status === "payment_payout_completed"
    );
  }, [payment.status]);

  const destinationTxHash = getDestinationTxHash();
  const destinationAddress = getDestinationAddress();
  const destinationChainId = getDestinationChainId();

  // For recipient: if payment is completed but no TX hash, use address
  const recipientExplorerData = useMemo(() => {
    if (
      isPaymentCompleted &&
      !destinationTxHash &&
      destinationAddress &&
      destinationChainId
    ) {
      return {
        address: destinationAddress,
        txHash: undefined,
      };
    }
    return {
      address: undefined,
      txHash: destinationTxHash,
    };
  }, [
    isPaymentCompleted,
    destinationTxHash,
    destinationAddress,
    destinationChainId,
  ]);

  const sourceChainId = getSourceChainId();

  return (
    <div className="flex flex-col w-full gap-4 max-w-[350px]">
      {/* User View: Sender -> Recipient */}
      <TransactionParticipant
        type="sender"
        name="Sender"
        address={getSourcePayerAddress()}
        chainId={sourceChainId}
        txHash={getSourceTxHash()}
        isCurrentUser={true}
        onExplorerClick={openExplorer}
      />

      <div className="flex size-8 items-center justify-center self-center">
        <ArrowDown className="text-muted-foreground size-5" />
      </div>

      <div className="-mt-6">
        <TransactionParticipant
          type="recipient"
          name={isForMerchant ? "Merchant" : "Recipient"}
          address={destinationAddress}
          chainId={destinationChainId}
          txHash={recipientExplorerData.txHash}
          explorerAddress={recipientExplorerData.address}
          onExplorerClick={openExplorer}
        />
      </div>
    </div>
  );
}
