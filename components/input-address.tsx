"use client";

import { Button } from "@/components/ui/button";
import { parseDeeplink, type DeeplinkData } from "@rozoai/deeplink-core";
import { ArrowRight, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Ethereum, Solana, Stellar } from "./icons/chains";
import { Input } from "./ui/input";

interface InputAddressProps {
  onAddressParsed?: (parsed: DeeplinkData) => void;
}

export function InputAddress({ onAddressParsed }: InputAddressProps) {
  const router = useRouter();

  const [inputValue, setInputValue] = useState("");
  const [parsedResult, setParsedResult] = useState<DeeplinkData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    setIsLoading(true);
    try {
      const parsed = parseDeeplink(inputValue.trim());
      if (parsed) {
        setParsedResult(parsed);
        onAddressParsed?.(parsed);

        // Show success message with address type
        const addressType = getAddressType(parsed);
        toast.success(`Valid ${addressType} address detected`);
      } else {
        toast.error("Invalid address or QR code");
        setParsedResult(null);
      }
    } catch (error) {
      console.error("Error parsing address:", error);
      toast.error("Failed to parse address");
      setParsedResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const getAddressType = (parsed: DeeplinkData): string => {
    switch (parsed.type) {
      case "ethereum":
        return "EVM";
      case "stellar":
        return "Stellar";
      case "solana":
        return "Solana";
      case "address":
        // For generic addresses, we can try to determine the type based on format
        return "EVM"; // Default to EVM for generic addresses
      default:
        return "Unknown";
    }
  };

  const handleSendCrypto = () => {
    router.replace(`?qr=${encodeURIComponent(inputValue)}`);
  };

  const handleKeyDown = (event: any) => {
    if (event.key === "Enter") {
      handleSubmit(event);
    }
  };

  return (
    <div className="w-full space-y-3">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1">
          <Input
            type="text"
            value={inputValue}
            placeholder="Enter wallet address (EVM or Stellar)"
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <Button
          type="submit"
          disabled={!inputValue.trim() || isLoading}
          size="icon"
        >
          {isLoading ? (
            <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
          ) : (
            <ArrowRight className="h-4 w-4" />
          )}
        </Button>
      </form>

      {parsedResult && (
        <div className="p-3 bg-muted/50 rounded-lg border">
          <div className="flex items-center justify-between gap-3">
            {parsedResult.type === "ethereum" && (
              <Ethereum width={32} height={32} />
            )}
            {parsedResult.type === "stellar" && (
              <Stellar width={32} height={32} />
            )}
            {parsedResult.type === "solana" && (
              <Solana width={32} height={32} />
            )}

            <div className="flex-1">
              {parsedResult.type === "address" && (
                <div className="">
                  <span className="text-xs text-muted-foreground">
                    Address:
                  </span>
                  <div className="text-xs font-mono break-all mt-1">
                    {(parsedResult as any).address}
                  </div>
                </div>
              )}
              {parsedResult.type === "ethereum" && (
                <div className="">
                  <span className="text-xs text-muted-foreground">
                    Ethereum Address:
                  </span>
                  <div className="text-xs font-mono break-all mt-1">
                    {(parsedResult as any).address}
                  </div>
                </div>
              )}
              {parsedResult.type === "stellar" && (
                <div className="">
                  <span className="text-xs text-muted-foreground">
                    Stellar Address:
                  </span>
                  <div className="text-xs font-mono break-all mt-1">
                    {(parsedResult as any).toStellarAddress}
                  </div>
                </div>
              )}
              {parsedResult.type === "solana" && (
                <div className="">
                  <span className="text-xs text-muted-foreground">
                    Solana Address:
                  </span>
                  <div className="text-xs font-mono break-all mt-1">
                    {(parsedResult as any).address}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 flex">
            <Button
              variant="default"
              size="sm"
              className="ml-auto"
              onClick={handleSendCrypto}
            >
              <Wallet />
              Send Crypto
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
