import { Button } from "@/components/ui/button";
import { ShareIcon } from "lucide-react";

interface ReceiptActionsProps {
  showMoreActions?: boolean;
  onToggleActions?: () => void;
  onShare: () => void;
  backUrl?: string;
}

export function ReceiptActions({ onShare }: ReceiptActionsProps) {
  return (
    <>
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
    </>
  );
}
