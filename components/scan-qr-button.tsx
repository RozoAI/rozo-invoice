"use client";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { parseQRCode } from "@/lib/deeplink";
import { RozoPayButton } from "@rozoai/intent-pay";
import { type IDetectedBarcode, Scanner } from "@yudiel/react-qr-scanner";
import { Loader2, ScanLine, Wallet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { getAddress } from "viem";

interface ScanQRButtonProps {
  appId: string;
}

type ParsedTransfer = {
  isStellar: boolean;
  toAddress: string;
  toStellarAddress?: string;
  toChain: number;
  toUnits: string | null;
  toToken: string | null;
};

export function ScanQRButton({ appId }: ScanQRButtonProps) {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [parsedTransfer, setParsedTransfer] = useState<ParsedTransfer | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleScan = (detectedCodes: IDetectedBarcode[]) => {
    if (detectedCodes.length === 0) return;

    const result = detectedCodes[0].rawValue;
    if (!result) return;

    const parsed = parseQRCode(result);
    setIsScannerOpen(false);

    switch (parsed.type) {
      case "website": {
        window.open(parsed.url, "_blank");
        break;
      }

      case "ethereum": {
        if (parsed.recipients?.length && parsed.asset?.contract) {
          setParsedTransfer({
            isStellar: false,
            toAddress: getAddress(parsed.recipients[0].address),
            toChain: parsed.chain_id ? Number(parsed.chain_id) : 0,
            toUnits: parsed.amount || null,
            toToken: getAddress(parsed.asset.contract),
          });
        }
        break;
      }

      case "address": {
        if (parsed.address && parsed.asset?.contract) {
          setParsedTransfer({
            isStellar: false,
            toAddress: getAddress(parsed.address),
            toChain: parsed.chain_id ? Number(parsed.chain_id) : 0,
            toUnits: null,
            toToken: getAddress(parsed.asset.contract),
          });

          if (parsed.message) {
            toast.info(parsed.message);
          }
        }
        break;
      }

      case "solana": {
        toast.info(parsed.message || `${parsed.type} support coming soon.`);
        break;
      }
      case "stellar": {
        if (parsed.address) {
          setParsedTransfer({
            isStellar: true,
            toAddress: parsed.address,
            toStellarAddress: parsed.toStellarAddress,
            toChain: parsed.chain_id ? Number(parsed.chain_id) : 0,
            toUnits: null,
            toToken: parsed.asset?.contract || null,
          });
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
  };

  const handleCancelPayment = () => {
    window.location.reload();
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
                <div className="h-80 w-full overflow-hidden rounded-lg border border-border">
                  <Scanner
                    onScan={handleScan}
                    onError={(error) => {
                      console.error("Scanner error:", error);
                    }}
                    sound={false}
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
          onPaymentCompleted={() => {
            setIsLoading(false);
            setParsedTransfer(null);
          }}
        >
          {({ show }) => (
            <div className="m-auto flex w-full flex-col gap-2">
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
