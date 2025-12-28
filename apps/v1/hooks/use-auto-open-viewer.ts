import { getClientExplorerPath } from "@/lib/path-helpers";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useLayoutEffect, useRef } from "react";

export function useAutoOpenViewer(
  mediaCount: number,
  onOpen: (index: number) => void
) {
  const searchParams = useSearchParams();
  const autoMode = searchParams.get("auto");

  const consumedRef = useRef(false);

  useLayoutEffect(() => {
    if (!autoMode) return;
    if (mediaCount === 0) return;
    if (consumedRef.current) return;

    consumedRef.current = true;

    const targetIndex = autoMode === "last" ? mediaCount - 1 : 0;
    onOpen(targetIndex);
  }, [autoMode, mediaCount, onOpen]);
}

type AutoMode = "first" | "last";

export function useFolderNavigation() {
  const router = useRouter();

  const handleFolderNavigation = useCallback(
    (targetPath: string, auto: AutoMode) => {
      const baseUrl = getClientExplorerPath(targetPath);
      const params = new URLSearchParams();

      if (auto) {
        params.append("auto", auto);
      }

      router.push(`${baseUrl}?${params}`);
    },
    [router]
  );

  return { handleFolderNavigation };
}
