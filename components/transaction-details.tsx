"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ParsedTransfer } from "./scan-qr-button";

interface TransactionDetailsProps {
  transfer: ParsedTransfer;
  className?: string;
}

function DetailRow({
  label,
  value,
  isAddress = false,
}: {
  label: string;
  value: string | number;
  isAddress?: boolean;
}) {
  const displayValue =
    isAddress && typeof value === "string"
      ? `${value.slice(0, 6)}...${value.slice(-4)}`
      : value;

  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{displayValue}</span>
    </div>
  );
}

export function TransactionDetails({
  transfer,
  className,
}: TransactionDetailsProps) {
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>Transaction Details</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <DetailRow
          label="Destination Address"
          value={transfer.toAddress}
          isAddress
        />
        {transfer.toUnits && (
          <DetailRow label="Amount" value={transfer.toUnits} />
        )}
        {transfer.toToken && (
          <DetailRow
            label="Contract Address"
            value={transfer.toToken}
            isAddress
          />
        )}
        <DetailRow label="Chain ID" value={transfer.toChain} />
      </CardContent>
    </Card>
  );
}
