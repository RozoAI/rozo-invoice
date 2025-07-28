"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatAddress } from "@/lib/utils";
import { CircleAlert } from "lucide-react";
import type { ParsedTransfer } from "./scan-qr-button";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

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
    isAddress && typeof value === "string" ? formatAddress(value) : value;

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
      <CardHeader className="p-0">
        <CardTitle>Transaction Details</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 p-0">
        {transfer.isStellar ? (
          <>
            {transfer.toStellarAddress && (
              <DetailRow
                label="Destination Address"
                value={transfer.toStellarAddress}
                isAddress
              />
            )}
            <DetailRow
              label="Bridge Address"
              value={transfer.toAddress}
              isAddress
            />
          </>
        ) : (
          <DetailRow
            label="Destination Address"
            value={transfer.toAddress}
            isAddress
          />
        )}
        {transfer.toUnits && (
          <DetailRow label="Amount" value={transfer.toUnits} />
        )}

        {transfer.toToken && (
          <DetailRow
            label={transfer.isStellar ? "Asset" : "Contract Address"}
            value={formatAddress(transfer.toToken)}
            isAddress={!transfer.isStellar}
          />
        )}
        {!transfer.isStellar && (
          <DetailRow label="Chain ID" value={transfer.toChain} />
        )}

        {transfer.message && (
          <Alert variant="default">
            <AlertTitle className="flex items-center gap-2">
              <CircleAlert className="h-4 w-4" /> Information
            </AlertTitle>
            <AlertDescription>{transfer.message}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
