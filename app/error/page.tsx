"use client";

import BoxedCard from "@/components/boxed-card";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { AlertCircle, ArrowLeft, Home } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ErrorPage() {
  const router = useRouter();

  const handleGoBack = () => {
    router.back();
  };

  return (
    <BoxedCard className="flex-1">
      <CardContent className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-8 text-center">
        {/* Error Icon */}
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-full bg-destructive/10 p-6">
            <AlertCircle className="size-16 text-destructive" />
          </div>
          
          {/* Error Message */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">
              Oops! Something went wrong
            </h1>
            <p className="text-muted-foreground max-w-md">
              We encountered an error while processing your request. This could be due to a network issue or the payment information might not be available.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 w-full max-w-sm">
          <Button 
            onClick={handleGoBack}
            className="w-full"
            size="lg"
          >
            <ArrowLeft className="size-4 mr-2" />
            Go Back
          </Button>
          
          <Button 
            variant="outline"
            asChild
            className="w-full"
            size="lg"
          >
            <Link href="/">
              <Home className="size-4 mr-2" />
              Go Home
            </Link>
          </Button>
        </div>

        {/* Help Text */}
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            If the problem persists, please contact support.
          </p>
          <p className="text-xs text-muted-foreground">
            Error Code: PAYMENT_NOT_FOUND
          </p>
        </div>
      </CardContent>
    </BoxedCard>
  );
}
