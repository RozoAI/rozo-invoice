import BoxedCard from "@/components/boxed-card";
import { ScanQRButton } from "@/components/scan-qr-button";
import { CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <BoxedCard className="flex-1">
      <CardContent className="m-auto w-full">
        <ScanQRButton appId={"rozoInvoice"} />
      </CardContent>
    </BoxedCard>
  );
}
