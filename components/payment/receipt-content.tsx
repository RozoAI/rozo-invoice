"use client";

import BoxedCard from "@/components/boxed-card";
import { CardContent } from "@/components/ui/card";
import { useExplorer } from "@/hooks/use-explorer";
import { useShareReceipt } from "@/hooks/use-share-receipt";
import { PaymentResponse } from "@/lib/payment-api";
import { RozoPayOrderView } from "@rozoai/intent-common";
import { useState } from "react";
import { PaymentStatus } from "./receipt/payment-status";
import { ReceiptActions } from "./receipt/receipt-actions";
import { TransactionFlow } from "./receipt/transaction-flow";
import { ViewTypeToggle } from "./receipt/view-type-toggle";

export default function ReceiptContent({
  payment,
  backUrl,
}: {
  payment: RozoPayOrderView | PaymentResponse;
  backUrl?: string;
}) {
  const [viewType, setViewType] = useState<"user" | "merchant">("user");
  const [showMoreActions, setShowMoreActions] = useState(false);

  const { openExplorer } = useExplorer();
  const { shareReceipt } = useShareReceipt(payment);

  return (
    <BoxedCard className="flex-1">
      <CardContent className="flex flex-1 flex-col items-center gap-8 px-4 py-0 text-center">
        <ViewTypeToggle viewType={viewType} onViewTypeChange={setViewType} />

        <PaymentStatus payment={payment} viewType={viewType} />

        {showMoreActions &&
        ((payment?.source && payment?.destination) ||
          ("payinTransactionHash" in payment &&
            "destination" in payment &&
            payment.payinTransactionHash &&
            payment.destination)) ? (
          <TransactionFlow
            payment={payment}
            viewType={viewType}
            onExplorerClick={openExplorer}
          />
        ) : null}

        <ReceiptActions
          showMoreActions={showMoreActions}
          onToggleActions={() => setShowMoreActions(!showMoreActions)}
          onShare={shareReceipt}
          backUrl={backUrl}
        />
      </CardContent>
    </BoxedCard>
  );
}
