"use client";

import { MediaListing } from "@/lib/media/types";
import { getClientExplorerPath } from "@/lib/path/helpers";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
} from "react";

interface ExplorerContextType {
  listing: MediaListing;
  index: number | null;
  modal: boolean;
  setIndex: (newIndex: number | "first" | "last") => void;
  openMedia: (index: number) => void;
  closeMedia: () => void;
  moveFolder: (path: string, at: "first" | "last" | number) => void;
}

const ExplorerContext = createContext<ExplorerContextType | undefined>(
  undefined
);

export function ExplorerProvider({
  children,
  listing,
}: {
  children: ReactNode;
  listing: MediaListing;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const atRaw = searchParams.get("at");
  const modal = searchParams.get("modal") === "true";

  const totalCount = listing.nodes.length;

  // インデックスの計算
  const index = useMemo(() => {
    if (atRaw === "last") return totalCount > 0 ? totalCount - 1 : 0;
    if (atRaw === "first") return 0;
    if (atRaw != null) return parseInt(atRaw, 10);
    return null;
  }, [atRaw, totalCount]);

  const setIndex = useCallback(
    (newIndex: number | "first" | "last") => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("at", String(newIndex));
      router.push(`${pathname}?${params.toString()}`);
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

  const value = useMemo(
    () => ({
      listing,
      index,
      modal,
      setIndex,
      openMedia,
      closeMedia,
      moveFolder,
    }),
    [listing, index, modal, setIndex, openMedia, closeMedia, moveFolder]
  );

  return (
    <ExplorerContext.Provider value={value}>
      {children}
    </ExplorerContext.Provider>
  );
}

export function useExplorer() {
  const context = useContext(ExplorerContext);
  if (context === undefined) {
    throw new Error("useExplorer must be used within an ExplorerProvider");
  }
  return context;
}
