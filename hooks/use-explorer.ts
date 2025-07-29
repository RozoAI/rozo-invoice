import { getChainExplorerTxUrl } from "@rozoai/intent-common";
import { useCallback } from "react";

export function useExplorer() {
  const openExplorer = useCallback(({
    chainId,
    hash,
  }: {
    chainId: string;
    hash: string;
  }) => {
    window.open(getChainExplorerTxUrl(Number(chainId), hash), "_blank");
  }, []);

  return { openExplorer };
}
