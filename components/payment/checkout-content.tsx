"use client";

import { NewPaymentResponse, PaymentResponse } from "@/lib/payment-api";
import { Web3Provider } from "@/providers/web3-provider";
import { RozoPayOrderView } from "@rozoai/intent-common";
import { useTheme } from "next-themes";
import BoxedCard from "../boxed-card";
import { ContactSupport } from "../contact-support";
import { Avatar, AvatarImage } from "../ui/avatar";
import { CardContent, CardFooter } from "../ui/card";
import { ErrorContent } from "./error-content";
import { PaymentContent } from "./payment-content";

type LoaderData = {
  success: boolean;
  payment?: RozoPayOrderView | PaymentResponse | NewPaymentResponse;
  appId?: string;
  error?: unknown;
  theme?: string;
  apiVersion?: "v1" | "v2";
};

export default function CheckoutContent({
  loaderData,
  appId,
}: {
  loaderData: LoaderData;
  appId?: string;
}) {
  const { resolvedTheme } = useTheme();

  return (
    <Web3Provider apiVersion={loaderData.apiVersion}>
      <BoxedCard className="flex-1">
        <CardContent className="flex flex-1 flex-col items-center gap-8 p-8 text-center">
          {/* Logo and Brand */}
          <div className="flex flex-col items-center gap-1">
            <Avatar className="size-8 rounded-none">
              <AvatarImage
                src={resolvedTheme === "dark" ? "/logo-white.png" : "/logo.png"}
                alt="Rozo Pay"
              />
            </Avatar>
            <h1 className="font-bold text-foreground">Rozo Pay</h1>
          </div>

          {loaderData.success && loaderData.payment ? (
            <PaymentContent
              appId={appId ?? loaderData.appId ?? ""}
              data={loaderData.payment}
            />
          ) : (
            <ErrorContent
              message={
                loaderData.error
                  ? String(loaderData.error)
                  : "An unknown error occurred"
              }
            />
          )}
        </CardContent>
        {loaderData.success && (
          <CardFooter className="pb-0 flex flex-col gap-4">
            <ContactSupport />
          </CardFooter>
        )}
      </BoxedCard>
    </Web3Provider>
  );
}
