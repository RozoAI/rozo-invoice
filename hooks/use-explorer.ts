import {
  getChainExplorerAddressUrl,
  getChainExplorerTxUrl,
} from "@rozoai/intent-common";
import { useCallback } from "react";

export function useExplorer() {
  const openExplorer = useCallback(
    ({
      chainId,
      hash,
      address,
    }: {
      chainId: string;
      hash?: string;
      address?: string;
    }) => {
      console.log("chainId", chainId);
      console.log("hash", hash);
      console.log("address", address);

      if (hash) {
        const url = getChainExplorerTxUrl(Number(chainId), hash);
        if (url) {
          window.open(url, "_blank");
        }
      } else if (address) {
        const url = getChainExplorerAddressUrl(Number(chainId), address);
        if (url) {
          window.open(url, "_blank");
        }
      }
    },
    []
  );

  return { openExplorer };
}
