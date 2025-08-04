import BoxedCard from "@/components/boxed-card";
import { ScanQRButton } from "@/components/scan-qr-button";
import { CardContent } from "@/components/ui/card";
import { Suspense } from "react";

export default function Home() {
  return (
    <BoxedCard className="flex-1">
      <CardContent className="m-auto w-full">
        <Suspense fallback={<div>Loading...</div>}>
          <ScanQRButton appId={"rozoInvoice"} />
        </Suspense>
      </CardContent>
    </BoxedCard>
  );
}
