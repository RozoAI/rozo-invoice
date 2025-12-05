"use client";

import BoxedCard from "@/components/boxed-card";
import { ContactSupport } from "@/components/contact-support";
import { ScanQRButton } from "@/components/scan-qr-button";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Web3Provider } from "@/providers/web3-provider";
import { useTheme } from "next-themes";
import { Suspense } from "react";

export default function Home() {
  const { resolvedTheme } = useTheme();

  return (
    <Web3Provider apiVersion="v2">
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
            <h1 className="font-bold text-foreground">Rozo Intent</h1>
            <p>Send USDC to Base or Stellar from any chains</p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <Suspense fallback={<div>Loading...</div>}>
            <ScanQRButton
              appId={process.env.NEXT_PUBLIC_ROZO_APP_ID ?? "rozoInvoice"}
            />
          </Suspense>
        </CardContent>

        <CardFooter className="pb-0 flex flex-col gap-4">
          <ContactSupport />
        </CardFooter>
      </BoxedCard>
    </Web3Provider>
  );
}
