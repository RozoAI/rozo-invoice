import { PaymentResponse } from "@/lib/payment-api";
import { RozoPayOrderView } from "@rozoai/intent-common";
import { ArrowDown } from "lucide-react";
import { TransactionParticipant } from "./transaction-participant";

interface TransactionFlowProps {
  payment: RozoPayOrderView | PaymentResponse;
  viewType: "user" | "merchant";
  onExplorerClick: ({
    chainId,
    hash,
  }: {
    chainId: string;
    hash: string;
  }) => void;
}

export function TransactionFlow({
  payment,
  viewType,
  onExplorerClick,
}: TransactionFlowProps) {
  // Helper to get source transaction hash
  const getSourceTxHash = () => {
    if (payment?.source?.txHash) {
      return payment.source.txHash;
    }
    if ("payinTransactionHash" in payment && payment.payinTransactionHash) {
      return payment.payinTransactionHash;
    }
    return "";
  };

  // Helper to get destination transaction hash
  const getDestinationTxHash = () => {
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
  };

  if (viewType === "user") {
    return (
      <div className="flex flex-col w-full gap-4 max-w-[350px]">
        {/* User View: Sender -> Recipient */}
        <TransactionParticipant
          type="sender"
          name="Sender"
          address={
            payment?.source?.payerAddress ??
            // ("receivingAddress" in payment ? payment.receivingAddress : "") ??
            ""
          }
          chainId={
            payment.source?.chainId ??
            ("payinchainid" in payment ? payment.payinchainid : "") ??
            ""
          }
          txHash={getSourceTxHash()}
          isCurrentUser={true}
          onExplorerClick={onExplorerClick}
        />

        <div className="flex size-8 items-center justify-center self-center">
          <ArrowDown className="text-muted-foreground size-5" />
        </div>

        <div className="-mt-6">
          <TransactionParticipant
            type="recipient"
            name="Merchant"
            address={payment?.destination?.destinationAddress ?? ""}
            chainId={payment.destination?.chainId ?? ""}
            txHash={getDestinationTxHash()}
            onExplorerClick={onExplorerClick}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full gap-4 max-w-[350px]">
      {/* Merchant View: Recipient -> Sender */}
      <TransactionParticipant
        type="recipient"
        name="Merchant"
        address={payment?.destination?.destinationAddress ?? ""}
        chainId={payment.destination?.chainId ?? ""}
        txHash={getDestinationTxHash()}
        isCurrentUser={true}
        onExplorerClick={onExplorerClick}
      />

      <div className="flex size-8 items-center justify-center self-center">
        <ArrowDown className="text-muted-foreground size-5" />
      </div>

      <div className="-mt-6">
        <TransactionParticipant
          type="sender"
          name="Sender"
          address={
            payment?.source?.payerAddress ??
            // ("receivingAddress" in payment ? payment.receivingAddress : "") ??
            ""
          }
          chainId={
            payment.source?.chainId ??
            ("payinchainid" in payment ? payment.payinchainid : "") ??
            ""
          }
          txHash={getSourceTxHash()}
          onExplorerClick={onExplorerClick}
        />
      </div>
    </div>
  );
}
