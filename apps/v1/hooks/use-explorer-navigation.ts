"use client";

import { getClientExplorerPath } from "@/lib/path-helpers";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export function useExplorerNavigation(itemsCount: number) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const atRaw = searchParams.get("at");
  const modal = searchParams.get("modal") === "true";

  // --- ここでキーワードを実際のインデックスに変換 ---
  let index: number | null = null;
  if (atRaw === "last") {
    index = itemsCount > 0 ? itemsCount - 1 : 0;
  } else if (atRaw === "first") {
    index = 0;
  } else if (atRaw != null) {
    index = parseInt(atRaw, 10);
  }

  const setIndex = useCallback(
    (newIndex: number | "first" | "last") => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("at", String(newIndex));

      const qs = params.toString();
      router.push(`${pathname}?${qs}`);
    },
    [pathname, router, searchParams]
  );

  const openMedia = useCallback(
    (index: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("modal", "true");
      params.set("at", String(index));
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  const closeMedia = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("modal");
    params.delete("at");
    router.push(`${pathname}?${params.toString()}`);
  }, [pathname, router, searchParams]);

  const moveFolder = useCallback(
    (path: string, at: "first" | "last" | number) => {
      const params = new URLSearchParams();
      if (modal) params.set("modal", "true");
      params.set("at", String(at));

      const baseUrl = getClientExplorerPath(path);
      router.push(`${baseUrl}?${params.toString()}`);
    },
    [modal, router]
  );

  return { index, modal, setIndex, openMedia, closeMedia, moveFolder };
}
