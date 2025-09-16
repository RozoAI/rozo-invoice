"use client";

import BoxedCard from "@/components/boxed-card";
import ChainsStacked from "@/components/chains-stacked";
import { ScanQRButton } from "@/components/scan-qr-button";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { useTheme } from "next-themes";
import { Suspense } from "react";

export default function Home() {
  const { resolvedTheme } = useTheme();

  return (
    <BoxedCard className="flex-1 flex justify-center">
      <CardHeader className="text-center space-y-4 pb-6">
        {/* Logo and Brand */}
        <div className="flex flex-col items-center gap-1">
          <Avatar className="size-8 rounded-none">
            <AvatarImage
              src={resolvedTheme === "dark" ? "/logo-white.png" : "/logo.png"}
              alt="Rozo Pay"
            />
          </Avatar>
          <h1 className="font-bold text-foreground">Rozo Invoice</h1>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <Suspense fallback={<div>Loading...</div>}>
          <ScanQRButton
            appId={process.env.NEXT_PUBLIC_DAIMO_API_KEY ?? "rozoInvoice"}
          />
        </Suspense>
      </CardContent>

      <CardFooter className="pb-0 md:pb-8 flex justify-center gap-2">
        <ChainsStacked />
        <span className="text-muted-foreground text-sm">
          Safe and Secure Payments
        </span>
      </CardFooter>
    </BoxedCard>
  );
}
