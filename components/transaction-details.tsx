"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatAddress } from "@/lib/utils";
import { getChainName, getKnownToken, rozoStellar, stellar } from "@rozoai/intent-common";
import { CircleAlert, Copy } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { chainLogos } from "./chains-stacked";
import type { ParsedTransfer } from "./scan-qr-button";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Button } from "./ui/button";

interface TransactionDetailsProps {
  transfer: ParsedTransfer;
  className?: string;
}

function DetailRow({
  label,
  value,
  coppiedText,
  isAddress = false,
  logo,
}: {
  label: string;
  value: string | number;
  isAddress?: boolean;
  coppiedText: string;
  logo?: React.ReactNode;
}) {
  const displayValue =
    isAddress && typeof value === "string" ? formatAddress(value) : value;

  const handleCopy = () => {
    navigator.clipboard.writeText(coppiedText);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        {logo && <div>{logo}</div>}
        <span className="font-medium">{displayValue}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="size-4 p-0"
          title="Copy to clipboard"
        >
          <Copy className="size-3" />
        </Button>
      </div>
    </div>
  );
}

export function TransactionDetails({
  transfer,
  className,
}: TransactionDetailsProps) {
  const isStellar =
    transfer.toChain === rozoStellar.chainId ||
    transfer.toChain === stellar.chainId;

  const token = getKnownToken(transfer.toChain, transfer.toToken);

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="p-0">
        <CardTitle>Transaction Details</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 p-0">
        {isStellar ? (
          <>
            {transfer.toAddress && (
              <DetailRow
                label="Destination Address"
                value={transfer.toAddress}
                isAddress
                coppiedText={transfer.toAddress}
              />
            )}
          </>
        ) : (
          <DetailRow
            label="Destination Address"
            value={transfer.toAddress}
            isAddress
            coppiedText={transfer.toAddress}
          />
        )}
        {transfer.toUnits && (
          <DetailRow
            label="Amount"
            value={transfer.toUnits}
            coppiedText={transfer.toUnits}
          />
        )}

        {!isStellar && transfer.toToken && (
          <DetailRow
            label={isStellar ? "Asset" : "Contract Address"}
            value={formatAddress(transfer.toToken)}
            isAddress={!isStellar}
            coppiedText={transfer.toToken}
            logo={<Image src={token?.logoURI ?? ""} alt={token?.name ?? ""} width={24} height={24} />}
          />
        )}
        {!isStellar && (
          <DetailRow
            label="Destination Chain"
            value={`${getChainName(transfer.toChain)}`}
            coppiedText={transfer.toChain.toString()}
            logo={chainLogos.find((logo) => logo.type === getChainName(transfer.toChain).toLowerCase())?.component}
          />
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
