"use client";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { formatAmount } from "@/lib/amount";
import {
  BlockchainParseResult,
  parseDeeplink,
  type AddressParseResult,
  type DeeplinkData,
  type EthereumParseResult,
  type StellarParseResult,
} from "@rozoai/deeplink-core";
import { ScanQr } from "@rozoai/deeplink-react";
import { PaymentCompletedEvent, baseUSDC } from "@rozoai/intent-common";
import { RozoPayButton, useRozoPayUI } from "@rozoai/intent-pay";
import { Loader2, ScanLine, Wallet } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
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
  const { resetPayment } = useRozoPayUI();

  const searchParams = useSearchParams();
  const router = useRouter();

  // Check for qr query parameter and parse it
  useEffect(() => {
    const qrParam = searchParams.get("qr");
    if (qrParam && !parsedTransfer) {
      const clearQrParam = () => {
        const newSearchParams = new URLSearchParams(searchParams.toString());
        newSearchParams.delete("qr");
        const newUrl = `${window.location.pathname}${
          newSearchParams.toString() ? `?${newSearchParams.toString()}` : ""
        }`;
        router.replace(newUrl);
      };

      try {
        const parsed = parseDeeplink(qrParam);
        if (parsed) {
          handleScan(parsed);
          clearQrParam();
        }
      } catch (error) {
        console.error("Error parsing QR from query parameter:", error);
        toast.error("Invalid QR code in URL");
        clearQrParam();
      }
    }
  }, [searchParams, parsedTransfer, router]);

  const handleScan = (parsed: DeeplinkData) => {
    if (!parsed) return;

    setIsScannerOpen(false);
    let parsedData: ParsedTransfer | null = null;

    const chainId = (parsed as BlockchainParseResult).chain_id;
    const toChain =
      chainId && chainId !== baseUSDC.chainId
        ? Number(chainId)
        : baseUSDC.chainId;

    switch (parsed.type) {
      case "website": {
        window.location.href = parsed.url;
        break;
      }

      case "address": {
        const data = parsed as AddressParseResult;
        if (data.address) {
          parsedData = {
            isStellar: false,
            toAddress: getAddress(data.address),
            toChain,
            toUnits: null,
            toToken: getAddress(data.asset?.contract || baseUSDC.token),
            message: data.message,
          };

          if (data.message) {
            toast.info(data.message);
          }
        }
        break;
      }

      case "ethereum": {
        const data = parsed as EthereumParseResult;

        // Handle ERC-20 transfer function calls
        if (
          (data as any).function_name === "transfer" &&
          (data as any).parameters
        ) {
          const parameters = (data as any).parameters;
          const addressParam = parameters.find(
            (p: any) => p.type === "address"
          );
          const amountParam = parameters.find((p: any) => p.type === "uint256");

          if (addressParam?.value && data.address) {
            parsedData = {
              isStellar: false,
              toAddress: getAddress(addressParam.value),
              toChain,
              toUnits: amountParam?.value
                ? formatAmount(amountParam.value)
                : null,
              toToken: getAddress(data.address), // Contract address is the token
              message: data.message,
            };
          }
        }
        // Handle regular ethereum addresses
        else if (data.address) {
          parsedData = {
            isStellar: false,
            toAddress: getAddress(data.address),
            toChain,
            toUnits: data.amount ? formatAmount(data.amount) : null,
            toToken: getAddress(data.asset?.contract || baseUSDC.token),
            message: data.message,
          };
        }
        break;
      }

      case "solana": {
        toast.info(`${parsed.type} support coming soon.`);
        return;
      }

      case "stellar": {
        const data = parsed as StellarParseResult;
        if (data.address && data.toStellarAddress) {
          parsedData = {
            isStellar: true,
            toAddress: data.address,
            toStellarAddress: data.toStellarAddress,
            toChain,
            toUnits: data.amount
              ? String(parseFloat(String(data.amount || 0)))
              : null,
            toToken: data.asset?.contract || baseUSDC.token,
            message: data.message,
          };
        }

        if (data.message) {
          toast.info(data.message);
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
      toast.error("Invalid QR code");
      return;
    }

    setParsedTransfer(parsedData);
    resetPayment({
      toChain: parsedData.toChain,
      toAddress: getAddress(parsedData.toAddress),
      toStellarAddress: parsedData.toStellarAddress,
      toToken: getAddress(parsedData.toToken),
      toUnits: parsedData.toUnits ?? undefined,
    });
  };

  const handleCancelPayment = () => {
    // window.location.reload();
    resetPayment();
    setParsedTransfer(null);
    setIsScannerOpen(false);
    setIsLoading(false);
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

      {parsedTransfer !== null && (
        <RozoPayButton.Custom
          defaultOpen
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
            toast.success(`Payment completed for $${parsedTransfer.toUnits}`);
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
