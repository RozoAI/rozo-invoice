import BoxedCard from "@/components/boxed-card";
import { ScanQRButton } from "@/components/scan-qr-button";
import { CardContent } from "@/components/ui/card";
import { Suspense } from "react";

export default function Home() {
  return (
    <BoxedCard className="flex-1">
      <CardContent className="m-auto w-full">
        <Suspense fallback={<div>Loading...</div>}>
          <ScanQRButton appId={process.env.NEXT_PUBLIC_DAIMO_API_KEY ?? "rozoInvoice"} />
        </Suspense>
      </CardContent>
    </BoxedCard>
  );
}
