import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, ShareIcon } from "lucide-react";
import Link from "next/link";

interface ReceiptActionsProps {
  showMoreActions: boolean;
  onToggleActions: () => void;
  onShare: () => void;
  backUrl?: string;
}

export function ReceiptActions({
  showMoreActions,
  onToggleActions,
  onShare,
  backUrl,
}: ReceiptActionsProps) {
  return (
    <>
      {showMoreActions && (
        <div className="flex flex-col w-full gap-2 max-w-[350px]">
          <Button
            className="w-full rounded-lg h-10 text-base"
            size="lg"
            onClick={onShare}
          >
            <ShareIcon className="size-4 mr-2" />
            Share Receipt
          </Button>
        </div>
      )}

      <Button
        variant="ghost"
        className="w-full rounded-lg text-muted-foreground max-w-[350px]"
        size="sm"
        onClick={onToggleActions}
      >
        {showMoreActions ? (
          <>
            <ChevronUp size={14} className="mr-2" />
            View Less
          </>
        ) : (
          <>
            <ChevronDown size={14} className="mr-2" />
            View More
          </>
        )}
      </Button>

      <Button
        variant="outline"
        className="w-full rounded-lg text-muted-foreground max-w-[350px]"
        size="sm"
        asChild
      >
        <Link href={backUrl || "/"}>Back to Home</Link>
      </Button>
    </>
  );
}
