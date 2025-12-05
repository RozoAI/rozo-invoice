"use client";

import { getDefaultConfig, RozoPayProvider } from "@rozoai/intent-pay";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createConfig, WagmiProvider } from "wagmi";

const config = createConfig(
  getDefaultConfig({
    appName: "Rozo Invoice",
    appIcon: "https://rozo.ai/rozo-logo.png",
  })
);

const queryClient = new QueryClient();

export function Web3Provider({
  children,
  apiVersion = "v1",
}: {
  children: React.ReactNode;
  apiVersion?: "v1" | "v2";
}) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RozoPayProvider apiVersion={apiVersion}>{children}</RozoPayProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
