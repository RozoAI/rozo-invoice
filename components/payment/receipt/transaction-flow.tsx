import { RozoPayOrderView } from "@rozoai/intent-common";
import { ArrowDown } from "lucide-react";
import { TransactionParticipant } from "./transaction-participant";

interface TransactionFlowProps {
  payment: RozoPayOrderView;
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
  if (viewType === "user") {
    return (
      <div className="flex flex-col w-full gap-4 max-w-[350px]">
        {/* User View: Sender -> Recipient */}
        <TransactionParticipant
          type="sender"
          name="Sender"
          address={payment?.source?.payerAddress ?? ""}
          chainId={payment.source?.chainId ?? ""}
          txHash={payment.source?.txHash ?? ""}
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
            txHash={payment.destination?.txHash ?? ""}
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
        txHash={payment.destination?.txHash ?? ""}
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
          address={payment?.source?.payerAddress ?? ""}
          chainId={payment.source?.chainId ?? ""}
          txHash={payment.source?.txHash ?? ""}
          onExplorerClick={onExplorerClick}
        />
      </div>
    </div>
  );
}
