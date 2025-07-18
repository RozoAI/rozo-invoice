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
import type { EIP681Transfer } from "@/lib/deeplink/types";
import { RozoPayButton } from "@rozoai/intent-pay";
import { type IDetectedBarcode, Scanner } from "@yudiel/react-qr-scanner";
import { Loader2, ScanLine, Wallet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ScanQRButtonProps {
  appId: string;
}

export function ScanQRButton({ appId }: ScanQRButtonProps) {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [parsedTransfer, setParsedTransfer] = useState<EIP681Transfer | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleScan = (detectedCodes: IDetectedBarcode[]) => {
    if (detectedCodes.length === 0) return;

    const result = detectedCodes[0].rawValue;
    if (!result) return;

    const parsed = parseQRCode(result);
    setIsScannerOpen(false); // always close after parsing

    switch (parsed.type) {
      case "website": {
        window.open(parsed.website, "_blank");
        break;
      }

      case "eip681": {
        if (parsed.transfer) {
          setParsedTransfer(parsed.transfer);
        }
        break;
      }

      case "address": {
        if (parsed.transfer) {
          setParsedTransfer(parsed.transfer);

          if (parsed.message) {
            toast.info(parsed.message);
          }
        }
        break;
      }

      case "solana":
      case "stellar": {
        toast.info(parsed.message || `${parsed.type} support coming soon.`);
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
          key={`${parsedTransfer.chainId}-${parsedTransfer.recipient}-${parsedTransfer.contractAddress}`}
          defaultOpen
          appId={appId}
          toAddress={parsedTransfer.recipient}
          toChain={Number(parsedTransfer.chainId)}
          {...(parsedTransfer.amount && {
            toUnits: parsedTransfer.amount,
          })}
          toToken={parsedTransfer.contractAddress}
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
