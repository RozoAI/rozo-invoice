import { redirect } from "next/navigation";

export type ErrorType =
  | "PAYMENT_NOT_FOUND"
  | "API_ERROR"
  | "NETWORK_ERROR"
  | "INVALID_REQUEST"
  | "PAYMENT_UNPAID";

export type ErrorSource = "receipt" | "checkout" | "payment";

export interface ErrorDetails {
  type: ErrorType;
  source?: ErrorSource;
  id?: string;
  message?: string;
}

/**
 * Creates standardized error parameters for redirecting to error page
 */
export function createErrorParams(details: ErrorDetails): URLSearchParams {
  const params = new URLSearchParams({
    type: details.type,
  });

  if (details.source) {
    params.set("source", details.source);
  }

  if (details.id) {
    params.set("id", details.id);
  }

  if (details.message) {
    params.set("message", details.message);
  }

  return params;
}

/**
 * Redirects to error page with standardized error information
 */
export function redirectToError(details: ErrorDetails): never {
  const errorParams = createErrorParams(details);
  return redirect(`/error?${errorParams.toString()}`);
}

/**
 * Convenience function for the most common case - payment not found
 */
export function redirectToPaymentNotFound(
  source: ErrorSource,
  id?: string,
  message?: string
): never {
  return redirectToError({
    type: "PAYMENT_NOT_FOUND",
    source,
    id,
    message,
  });
}

/**
 * Generates error message for missing parameters
 */
export function getMissingParamsMessage(source: ErrorSource): string {
  switch (source) {
    case "receipt":
      return "Payment ID or transaction hash is required to view the receipt.";
    case "checkout":
      return "Payment ID is required to access checkout.";
    default:
      return "Required parameters are missing.";
  }
}

/**
 * Generates error message for payment not found
 */
export function getPaymentNotFoundMessage(
  source: ErrorSource,
  id?: string
): string {
  const baseMessage =
    source === "receipt"
      ? "Payment could not be found or loaded"
      : "Payment information could not be retrieved";

  return id ? `${baseMessage} for ID: ${id}.` : `${baseMessage}.`;
}

/**
 * Handles unknown error and extracts meaningful message
 */
export function getUnknownErrorMessage(
  error: unknown,
  source: ErrorSource
): string {
  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  const baseMessage =
    source === "receipt"
      ? "An unexpected error occurred while loading the receipt"
      : "An unexpected error occurred while processing your request";

  return `${baseMessage}.`;
}
