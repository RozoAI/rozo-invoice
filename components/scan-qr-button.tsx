"use client";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { type DeeplinkData } from "@rozoai/deeplink-core";
import { ScanQr } from "@rozoai/deeplink-react";
import { PaymentCompletedEvent, baseUSDC } from "@rozoai/intent-common";
import { RozoPayButton } from "@rozoai/intent-pay";
import { Loader2, ScanLine, Wallet } from "lucide-react";
import { redirect } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { getAddress } from "viem";
import { TransactionDetails } from "./transaction-details";

interface ScanQRButtonProps {
  appId: string;
}

export type ParsedTransfer = {
  isStellar: boolean;
  toAddress: string;
  toStellarAddress?: string;
  toChain: number;
  toUnits: string | null;
  toToken: string | null;
  message?: string;
};

export function ScanQRButton({ appId }: ScanQRButtonProps) {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [parsedTransfer, setParsedTransfer] = useState<ParsedTransfer | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);

  const formatAmount = (rawAmount: string, decimals: number): string => {
    if (!rawAmount) return "0";

    const amount = parseFloat(rawAmount) / Math.pow(10, decimals);

    // Format with up to 6 decimal places, removing trailing zeros
    return amount.toFixed(decimals).replace(/\.?0+$/, "");
  };

  const handleScan = (parsed: DeeplinkData) => {
    if (!parsed) return;

    setIsScannerOpen(false);
    let parsedData: ParsedTransfer | null = null;

    switch (parsed.type) {
      case "website": {
        window.location.href = parsed.url;
        break;
      }

      case "address": {
        if (parsed.address) {
          parsedData = {
            isStellar: false,
            toAddress: getAddress(parsed.address),
            toChain:
              parsed.chain_id && parsed.chain_id !== baseUSDC.chainId
                ? Number(parsed.chain_id)
                : baseUSDC.chainId,
            toUnits: null,
            toToken: getAddress(parsed.asset?.contract || baseUSDC.token),
            message: parsed.message,
          };

          if (parsed.message) {
            toast.info(parsed.message);
          }
        }
        break;
      }

      case "ethereum": {
        if (parsed.address) {
          parsedData = {
            isStellar: false,
            toAddress: getAddress(parsed.address),
            toChain:
              parsed.chain_id && parsed.chain_id !== baseUSDC.chainId
                ? Number(parsed.chain_id)
                : baseUSDC.chainId,
            toUnits:
              formatAmount(
                parsed.amount || "0",
                parsed.asset?.decimals || baseUSDC.decimals
              ) || null,
            toToken: getAddress(parsed.asset?.contract || baseUSDC.token),
            message: parsed.message,
          };
        }
        break;
      }

      case "solana": {
        toast.info(`${parsed.type} support coming soon.`);
        return;
      }

      case "stellar": {
        if (parsed.address && parsed.toStellarAddress) {
          parsedData = {
            isStellar: true,
            toAddress: parsed.address,
            toStellarAddress: parsed.toStellarAddress,
            toChain: parsed.chain_id ? Number(parsed.chain_id) : 0,
            toUnits: parsed.amount || null,
            toToken: parsed.asset?.contract || null,
            message: parsed.message,
          };
        }

        if (parsed.message) {
          toast.info(parsed.message);
        }

        break;
      }
      default: {
        toast.error("Unknown QR code type");
        break;
      }
    }

    if (
      !parsedData?.toToken ||
      !parsedData?.toAddress ||
      !parsedData?.toChain
    ) {
      return;
    }

    setParsedTransfer(parsedData);
  };

  const handleCancelPayment = () => {
    window.location.reload();
  };

  const handleScanError = (error: Error) => {
    console.error("Scanner error:", error);
    toast.error("Error scanning QR code");
  };

  return (
    <>
      {!parsedTransfer && (
        <Drawer open={isScannerOpen} onOpenChange={setIsScannerOpen}>
          <DrawerTrigger asChild className="m-auto w-full">
            <Button className="py-8 text-lg">
              <ScanLine className="size-7" />
              Scan QR Code
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Scan QR Code</DrawerTitle>
            </DrawerHeader>
            <div className="p-4">
              <div className="mx-auto w-full max-w-sm">
                <div className="w-full overflow-hidden rounded-lg">
                  <ScanQr
                    onScan={handleScan}
                    onError={handleScanError}
                    sound={false}
                    components={{
                      finder: false,
                      torch: false,
                    }}
                  />
                </div>
                <p className="mt-4 text-center text-muted-foreground text-sm">
                  Position the QR code within the scanner frame
                </p>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      )}

      {parsedTransfer && (
        <RozoPayButton.Custom
          defaultOpen
          closeOnSuccess
          resetOnSuccess
          appId={appId}
          toAddress={parsedTransfer.toAddress as `0x${string}`}
          toChain={parsedTransfer.toChain}
          {...(parsedTransfer.isStellar && {
            toStellarAddress: parsedTransfer.toStellarAddress,
          })}
          {...(parsedTransfer.toUnits && {
            toUnits: parsedTransfer.toUnits,
          })}
          toToken={parsedTransfer.toToken as `0x${string}`}
          onPaymentStarted={() => {
            setIsLoading(true);
          }}
          onPaymentBounced={() => {
            setIsLoading(false);
          }}
          onPaymentCompleted={(args: PaymentCompletedEvent) => {
            setIsLoading(false);
            setParsedTransfer(null);
            redirect(
              `/receipt?id=${args.payment.externalId ?? args.paymentId}`
            );
          }}
        >
          {({ show }) => (
            <div className="m-auto flex w-full flex-col gap-2">
              <TransactionDetails
                transfer={parsedTransfer}
                className="mb-4 border-0 p-0 shadow-none"
              />
              <Button
                className="w-full py-8 text-lg"
                size={"lg"}
                onClick={show}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Wallet />
                    Pay with Crypto
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                className="w-full py-8 text-lg"
                size={"lg"}
                onClick={handleCancelPayment}
                disabled={isLoading}
              >
                Cancel Payment
              </Button>
            </div>
          )}
        </RozoPayButton.Custom>
      )}
    </>
  );
}
