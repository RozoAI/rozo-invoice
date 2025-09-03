"use client";

import BoxedCard from "@/components/boxed-card";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { AlertCircle, ArrowLeft, Home } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ErrorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Extract error details from URL parameters
  const errorMessage = searchParams.get("message");
  const errorSource = searchParams.get("source");
  const errorId = searchParams.get("id");
  const errorType = searchParams.get("type") || "PAYMENT_NOT_FOUND";

  // Create a descriptive title based on the error type
  const getErrorTitle = () => {
    switch (errorType) {
      case "PAYMENT_NOT_FOUND":
        return "Payment Not Found";
      case "API_ERROR":
        return "Service Unavailable";
      case "NETWORK_ERROR":
        return "Connection Error";
      case "INVALID_REQUEST":
        return "Invalid Request";
      default:
        return "Payment Not Found";
    }
  };

  // Create a descriptive message based on available information
  const getErrorMessage = () => {
    if (errorMessage) {
      return errorMessage;
    }

    const baseMessage =
      errorSource === "receipt"
        ? "We couldn't load the payment receipt"
        : "We encountered an error while processing your request";

    if (errorId) {
      return `${baseMessage} for ID: ${errorId}.`;
    }

    return `${baseMessage}. This could be due to a network issue or the requested information might not be available.`;
  };

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
              {getErrorTitle()}
            </h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 w-full max-w-sm">
          <Button onClick={handleGoBack} className="w-full" size="lg">
            <ArrowLeft className="size-4 mr-2" />
            Go Back
          </Button>

          <Button variant="outline" asChild className="w-full" size="lg">
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
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              Error Code: {errorType}
            </p>
            {errorId && (
              <p className="text-xs text-muted-foreground">ID: {errorId}</p>
            )}
          </div>
        </div>
      </CardContent>
    </BoxedCard>
  );
}

function ErrorFallback() {
  return (
    <BoxedCard className="flex-1">
      <CardContent className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-full bg-destructive/10 p-6">
            <AlertCircle className="size-16 text-destructive" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">
              Something went wrong
            </h1>
            <p className="text-muted-foreground max-w-md">
              We encountered an error while processing your request.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-sm">
          <Button variant="outline" asChild className="w-full" size="lg">
            <Link href="/">
              <Home className="size-4 mr-2" />
              Go Home
            </Link>
          </Button>
        </div>
      </CardContent>
    </BoxedCard>
  );
}

export default function ErrorPage() {
  return (
    <Suspense fallback={<ErrorFallback />}>
      <ErrorContent />
    </Suspense>
  );
}
