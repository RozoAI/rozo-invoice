"use client";

import {
  NewPaymentResponse,
  PaymentResponse,
  getPaymentDataClient,
} from "@/lib/payment-api";
import { RozoPayOrderView } from "@rozoai/intent-common";
import Pusher from "pusher-js";
import { useEffect, useRef, useState } from "react";

interface PusherStatusUpdatePayload {
  payment_id: string;
  status: "payment_payin_completed" | "payment_payout_completed";
  source_txhash?: string;
  destination_txhash?: string;
}

export function usePusherPayout(
  payment: RozoPayOrderView | PaymentResponse | NewPaymentResponse,
  enabled: boolean = true
) {
  const [currentPayment, setCurrentPayment] = useState<
    RozoPayOrderView | PaymentResponse | NewPaymentResponse
  >(payment);
  const [shouldFallbackToPolling, setShouldFallbackToPolling] = useState(false);
  const pusherRef = useRef<Pusher | null>(null);
  const channelRef = useRef<any>(null);
  const paymentIdRef = useRef<string | undefined>(payment?.id);
  const currentPaymentRef = useRef<
    RozoPayOrderView | PaymentResponse | NewPaymentResponse
  >(payment);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasReceivedUpdateRef = useRef<boolean>(false);

  // Sync currentPayment with payment prop changes
  useEffect(() => {
    setCurrentPayment(payment);
    paymentIdRef.current = payment?.id;
    currentPaymentRef.current = payment;
  }, [payment]);

  useEffect(() => {
    if (!enabled) {
      console.log("[usePusherPayout] Disabled, cleaning up...");
      // Cleanup if disabled
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (channelRef.current) {
        channelRef.current.unbind_all();
        channelRef.current = null;
      }
      if (pusherRef.current) {
        pusherRef.current.disconnect();
        pusherRef.current = null;
      }
      setShouldFallbackToPolling(false);
      hasReceivedUpdateRef.current = false;
      return;
    }

    if (!currentPayment?.id) {
      console.log(
        "[usePusherPayout] No payment ID available, skipping Pusher setup"
      );
      return;
    }

    paymentIdRef.current = currentPayment.id;
    currentPaymentRef.current = currentPayment;
    hasReceivedUpdateRef.current = false;
    setShouldFallbackToPolling(false);

    console.log(
      "[usePusherPayout] Initializing Pusher for payment:",
      currentPayment.id
    );

    // Initialize Pusher
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY as string, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER as string,
    });

    pusherRef.current = pusher;

    // Subscribe to channel
    const channelName = `payments-${currentPayment.id}`;
    console.log("[usePusherPayout] Subscribing to channel:", channelName);
    const channel = pusher.subscribe(channelName);
    channelRef.current = channel;

    // Log subscription success and start 1-minute timeout
    channel.bind("pusher:subscription_succeeded", () => {
      console.log(
        "[usePusherPayout] Successfully subscribed to channel:",
        channelName
      );

      // Check if payment already has destination_txhash (using ref for latest value)
      const payment = currentPaymentRef.current;
      const hasDestinationTxHash =
        ("payoutTransactionHash" in payment && payment.payoutTransactionHash) ||
        (payment.destination &&
          "txHash" in payment.destination &&
          payment.destination.txHash);

      // Only start timeout if payment doesn't already have destination_txhash
      if (!hasDestinationTxHash) {
        console.log(
          "[usePusherPayout] Starting 1-minute timeout for fallback to polling"
        );

        // Set timeout for 1 minute (60000ms)
        timeoutRef.current = setTimeout(() => {
          if (!hasReceivedUpdateRef.current) {
            console.log(
              "[usePusherPayout] No updates received in 1 minute, enabling polling fallback"
            );
            setShouldFallbackToPolling(true);
          } else {
            console.log(
              "[usePusherPayout] Updates received, no fallback needed"
            );
          }
        }, 60000); // 1 minute
      } else {
        console.log(
          "[usePusherPayout] Payment already has destination_txhash, skipping timeout"
        );
      }
    });

    // Log subscription errors
    channel.bind("pusher:subscription_error", (error: any) => {
      console.error("[usePusherPayout] Subscription error:", error);
    });

    // Listen for status-update event
    channel.bind("status-update", async (data: PusherStatusUpdatePayload) => {
      console.log("[usePusherPayout] Received status-update event:", {
        payment_id: data.payment_id,
        status: data.status,
        source_txhash: data.source_txhash,
        destination_txhash: data.destination_txhash,
      });

      // Verify payment_id matches (using ref to avoid closure issues)
      if (data.payment_id !== paymentIdRef.current) {
        console.log(
          "[usePusherPayout] Payment ID mismatch:",
          data.payment_id,
          "!=",
          paymentIdRef.current
        );
        return;
      }

      // Mark that we've received an update and clear the timeout
      hasReceivedUpdateRef.current = true;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
        console.log(
          "[usePusherPayout] Update received, cleared fallback timeout"
        );
      }

      // Fetch fresh data from API to ensure we have the complete state
      console.log("[usePusherPayout] Fetching fresh payment data from API...");
      try {
        const result = await getPaymentDataClient(data.payment_id);
        if (result.success && result.payment) {
          console.log(
            "[usePusherPayout] API fetch successful, updating state with full data"
          );
          setCurrentPayment(result.payment);
          currentPaymentRef.current = result.payment;
          return;
        }
        console.warn(
          "[usePusherPayout] API fetch failed or returned no data, falling back to manual update:",
          result.error
        );
      } catch (error) {
        console.error(
          "[usePusherPayout] Error fetching payment data from API:",
          error
        );
      }

      console.log("[usePusherPayout] Processing status update manually:", {
        status: data.status,
        destination_txhash: data.destination_txhash,
        source_txhash: data.source_txhash,
      });

      // Update payment state
      setCurrentPayment((prev) => {
        // Create a new object to trigger re-render
        const updated = { ...prev };

        // Update status
        updated.status = data.status;

        // Update destination_txhash if provided
        if (data.destination_txhash) {
          // For PaymentResponse
          if ("payoutTransactionHash" in updated) {
            (updated as PaymentResponse).payoutTransactionHash =
              data.destination_txhash;
            console.log(
              "[usePusherPayout] Updated payoutTransactionHash:",
              data.destination_txhash
            );
          }

          // For NewPaymentResponse or RozoPayOrderView with destination
          if (
            "destination" in updated &&
            updated.destination &&
            typeof updated.destination === "object"
          ) {
            // Create a new destination object to avoid mutation
            updated.destination = {
              ...updated.destination,
              txHash: data.destination_txhash,
            };
            console.log(
              "[usePusherPayout] Updated destination.txHash:",
              data.destination_txhash
            );
          }
        }

        // Update source_txhash if provided
        if (data.source_txhash) {
          // For PaymentResponse
          if ("payinTransactionHash" in updated) {
            (updated as PaymentResponse).payinTransactionHash =
              data.source_txhash;
            console.log(
              "[usePusherPayout] Updated payinTransactionHash:",
              data.source_txhash
            );
          }

          // For NewPaymentResponse or RozoPayOrderView with source
          if (
            "source" in updated &&
            updated.source &&
            typeof updated.source === "object"
          ) {
            // Create a new source object to avoid mutation
            updated.source = {
              ...updated.source,
              txHash: data.source_txhash,
            };
            console.log(
              "[usePusherPayout] Updated source.txHash:",
              data.source_txhash
            );
          }
        }

        console.log("[usePusherPayout] Payment state updated:", {
          status: updated.status,
          hasDestinationTxHash: !!(
            (updated as any).payoutTransactionHash ||
            (updated as any).destination?.txHash
          ),
          hasSourceTxHash: !!(
            (updated as any).payinTransactionHash ||
            (updated as any).source?.txHash
          ),
        });

        // Update ref with latest payment
        currentPaymentRef.current = updated;
        return updated;
      });
    });

    // Cleanup on unmount or when dependencies change
    return () => {
      console.log("[usePusherPayout] Cleaning up Pusher connection");
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (channelRef.current) {
        channelRef.current.unbind_all();
        channelRef.current = null;
      }
      if (pusherRef.current) {
        pusherRef.current.disconnect();
        pusherRef.current = null;
      }
      hasReceivedUpdateRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPayment?.id, enabled]);

  return { currentPayment, shouldFallbackToPolling };
}
