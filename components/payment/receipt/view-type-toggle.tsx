import { cn } from "@/lib/utils";

interface ViewTypeToggleProps {
  viewType: "user" | "merchant";
  onViewTypeChange: (type: "user" | "merchant") => void;
}

export function ViewTypeToggle({ viewType, onViewTypeChange }: ViewTypeToggleProps) {
  return (
    <div className="p-1 bg-muted rounded-lg flex w-full max-w-[350px]">
      <button
        onClick={() => onViewTypeChange("user")}
        className={cn(
          "w-full rounded-md p-2 text-sm font-medium",
          viewType === "user" && "bg-background shadow-sm"
        )}
      >
        User
      </button>
      <button
        onClick={() => onViewTypeChange("merchant")}
        className={cn(
          "w-full rounded-md p-2 text-sm font-medium",
          viewType === "merchant" && "bg-background shadow-sm"
        )}
      >
        Merchant
      </button>
    </div>
  );
}
