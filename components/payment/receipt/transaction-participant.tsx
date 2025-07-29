import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatAddress } from "@/lib/utils";
import { getChainName } from "@rozoai/intent-common";
import { ExternalLinkIcon, StoreIcon, User } from "lucide-react";

interface TransactionParticipantProps {
  type: "sender" | "recipient";
  name: string;
  address: string;
  chainId: string;
  txHash: string;
  isCurrentUser?: boolean;
  onExplorerClick: ({ chainId, hash }: { chainId: string; hash: string }) => void;
}

export function TransactionParticipant({
  type,
  name,
  address,
  chainId,
  txHash,
  isCurrentUser = false,
  onExplorerClick,
}: TransactionParticipantProps) {
  const isRecipient = type === "recipient";
  const isMerchant = name === "Merchant";
  
  return (
    <div className="flex flex-col gap-2">
      <span className="text-muted-foreground text-sm font-medium text-left">
        {type === "sender" ? "Sender" : "Recipient"}
      </span>
      <div
        className={`py-2 px-4 rounded-lg flex items-center gap-4 w-full cursor-pointer hover:opacity-80 transition-opacity ${
          isRecipient 
            ? "border-2 bg-background" 
            : "border bg-muted/30"
        }`}
        onClick={() => onExplorerClick({ chainId, hash: txHash })}
      >
        <Avatar className="size-10 shadow bg-white p-2">
          <AvatarImage src="/" alt={name} />
          <AvatarFallback className="bg-transparent">
            {isMerchant ? (
              <StoreIcon className="size-5" />
            ) : (
              <User className="size-5" />
            )}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col text-left flex-1">
          <span className="font-semibold text-foreground">
            {name}
            {isCurrentUser && (
              <span className="text-muted-foreground font-normal"> (You)</span>
            )}
          </span>
          <span className="text-muted-foreground text-sm">
            {formatAddress(address)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-muted-foreground bg-muted border rounded-full px-2 py-0.5">
            {getChainName(Number(chainId))}
          </div>
          <ExternalLinkIcon className="size-4" />
        </div>
      </div>
    </div>
  );
}
