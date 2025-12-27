import { getClientExplorerPath } from "@/lib/path-helpers";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";

export function useAutoOpenViewer(
  mediaCount: number,
  onOpen: (index: number) => void
) {
  const searchParams = useSearchParams();
  const autoMode = searchParams.get("auto");

  useEffect(() => {
    if (!autoMode) return;
    if (mediaCount === 0) return;

    const targetIndex = autoMode === "last" ? mediaCount - 1 : 0;

    setTimeout(() => {
      onOpen(targetIndex);

      // クエリを消す（リロード対策）
      const url = new URL(window.location.href);
      if (url.searchParams.has("auto")) {
        url.searchParams.delete("auto");
        window.history.replaceState(null, "", url.pathname + url.search);
      }
    }, 0);
  }, [autoMode, mediaCount, onOpen]);
}

export function useFolderNavigation() {
  const router = useRouter();

  const handleFolderNavigation = useCallback(
    (targetPath: string, autoMode?: "first" | "last") => {
      const baseUrl = getClientExplorerPath(targetPath);
      const params = new URLSearchParams();

      if (autoMode) {
        params.append("auto", autoMode);
      }

      const queryString = params.toString();
      const href = queryString ? `${baseUrl}?${queryString}` : baseUrl;
      router.push(href);
    },
    [router]
  );

  return { handleFolderNavigation };
}
