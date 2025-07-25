"use client";

import BoxedCard from "@/components/boxed-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowDown, BadgeCheckIcon, ExternalLink, ShareIcon } from "lucide-react";
import { useState } from "react";

export default function Receipt() {
  const [viewType, setViewType] = useState<'user' | 'merchant'>('user');

  return (
    <BoxedCard className="flex-1">
      <CardContent className="flex flex-1 flex-col items-center gap-8 px-4 py-0 text-center">
        <div className="p-1 bg-muted rounded-lg flex w-full max-w-[350px]">
          <button
            onClick={() => setViewType('user')}
            className={cn(
              "w-full rounded-md p-2 text-sm font-medium",
              viewType === 'user' && 'bg-background shadow-sm'
            )}
          >
            User
          </button>
          <button
            onClick={() => setViewType('merchant')}
            className={cn(
              "w-full rounded-md p-2 text-sm font-medium",
              viewType === 'merchant' && 'bg-background shadow-sm'
            )}
          >
            Merchant
          </button>
        </div>
        <div className="flex flex-col items-center border-b border-dashed pb-6 w-full">
          <BadgeCheckIcon className="size-[90px] fill-[#0052FF] text-white" />
          <div className="space-y-1 mt-2 ">
            <h3 className="font-semibold  text-xl">
              {viewType === 'user' ? 'Payment Completed' : 'Payment Received'}
            </h3>
            <span className="text-muted-foreground text-sm">
              {viewType === 'user'
                ? 'Your payment has been successfully done'
                : 'A payment has been successfully received'}
            </span>
          </div>

          <div className="mt-6">
            <span className="text-muted-foreground text-sm">
              Total Payment
            </span>
            <h2 className="font-bold text-4xl">
              20 USD
            </h2>
            <span className="text-muted-foreground text-xs">on Base &bull; Sent 20 minutes ago</span>
          </div>
        </div>

        <div className="flex flex-col w-full gap-4 max-w-[350px]">
          {viewType === 'user' ? (
            <>
              {/* User View: Sender -> Recipient */}
              <div className="flex flex-col gap-2">
                <span className="text-muted-foreground text-sm font-medium text-left">Sender</span>
                <div className="py-2 px-4 border rounded-lg bg-muted/30 flex items-center gap-4 w-full">
                  <Avatar className="size-10 shadow bg-white p-2">
                    <AvatarImage src="/" alt="Sender" />
                    <AvatarFallback className="bg-transparent">S</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col text-left">
                    <span className="font-semibold text-foreground">
                      Molla <span className="text-muted-foreground font-normal">(You)</span>
                    </span>
                    <span className="text-muted-foreground text-sm">0x0Ac37f...4966</span>
                  </div>
                  <div className="ml-auto text-xs text-muted-foreground bg-muted border rounded-full px-2 py-0.5">
                    Base
                  </div>
                </div>
              </div>

              <div className="flex size-8 items-center justify-center self-center">
                <ArrowDown className="text-muted-foreground size-5" />
              </div>

              <div className="flex flex-col gap-2 -mt-6">
                <span className="text-muted-foreground text-sm font-medium text-left">Recipient</span>
                <div className="py-2 px-4 border-2 rounded-lg bg-background flex items-center gap-4 w-full">
                  <Avatar className="size-10 shadow bg-white p-2">
                    <AvatarImage src="/" alt="Rozo Pay" />
                    <AvatarFallback className="bg-transparent">RP</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col text-left">
                    <span className="font-semibold text-foreground">Rozo Pay</span>
                    <span className="text-muted-foreground text-sm">0x0Ac37f...4966</span>
                  </div>
                  <div className="ml-auto text-xs text-muted-foreground bg-muted border rounded-full px-2 py-0.5">
                    Stellar
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Merchant View: Recipient -> Sender */}
              <div className="flex flex-col gap-2">
                <span className="text-muted-foreground text-sm font-medium text-left">Recipient</span>
                <div className="py-2 px-4 border-2 rounded-lg bg-background flex items-center gap-4 w-full">
                  <Avatar className="size-10 shadow bg-white p-2">
                    <AvatarImage src="/" alt="Rozo Pay" />
                    <AvatarFallback className="bg-transparent">RP</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col text-left">
                    <span className="font-semibold text-foreground">
                      Rozo Pay <span className="text-muted-foreground font-normal">(You)</span>
                    </span>
                    <span className="text-muted-foreground text-sm">0x0Ac37f...4966</span>
                  </div>
                  <div className="ml-auto text-xs text-muted-foreground bg-muted border rounded-full px-2 py-0.5">
                    Stellar
                  </div>
                </div>
              </div>

              <div className="flex size-8 items-center justify-center self-center">
                <ArrowDown className="text-muted-foreground size-5" />
              </div>

              <div className="flex flex-col gap-2 -mt-6">
                <span className="text-muted-foreground text-sm font-medium text-left">Sender</span>
                <div className="py-2 px-4 border rounded-lg bg-muted/30 flex items-center gap-4 w-full">
                  <Avatar className="size-10 shadow bg-white p-2">
                    <AvatarImage src="/" alt="Sender" />
                    <AvatarFallback className="bg-transparent">S</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col text-left">
                    <span className="font-semibold text-foreground">Molla</span>
                    <span className="text-muted-foreground text-sm">0x0Ac37f...4966</span>
                  </div>
                  <div className="ml-auto text-xs text-muted-foreground bg-muted border rounded-full px-2 py-0.5">
                    Base
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col w-full gap-2 max-w-[350px]">
          <Button className="w-full rounded-lg h-10 text-base" size="lg">
            <ShareIcon className="size-4 mr-2" />
            Share Receipt
          </Button>

          <Button variant="ghost" className="w-full rounded-lg" size="sm">
            <ExternalLink size={14} className="mr-2" />
            View on Explorer
          </Button>
        </div>
      </CardContent>
    </BoxedCard>
  );
}