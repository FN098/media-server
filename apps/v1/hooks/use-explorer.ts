"use client";

import { useSetExplorerQuery } from "@/hooks/use-explorer-query";
import { MediaListing } from "@/lib/media/types";
import { IndexLike } from "@/lib/query/types";
import { useCallback } from "react";

export function useExplorer(listing: MediaListing) {
  const setExplorerQuery = useSetExplorerQuery();

  const openViewer = useCallback(
    (at: IndexLike) => {
      setExplorerQuery({ modal: true, at }, { history: "push" });
    },
    [setExplorerQuery]
  );

  const closeViewer = useCallback(() => {
    setExplorerQuery({ modal: false, at: null }, { history: "push" });
  }, [setExplorerQuery]);

  const openFolder = useCallback(
    (path: string, at?: IndexLike) => {
      setExplorerQuery({ at: at ?? null, q: "" }, { path, history: "push" });
    },
    [setExplorerQuery]
  );

  const openNextFolder = useCallback(
    (at: IndexLike) => {
      if (listing.next == null) return;
      openFolder(listing.next, at);
    },
    [listing.next, openFolder]
  );

  const openPrevFolder = useCallback(
    (at: IndexLike) => {
      if (listing.prev == null) return;
      openFolder(listing.prev, at);
    },
    [listing.prev, openFolder]
  );

  return {
    listing,
    openViewer,
    closeViewer,
    openFolder,
    openNextFolder,
    openPrevFolder,
  };
}
