"use client";

import { MediaListing } from "@/lib/media/types";
import { IndexLike } from "@/lib/query/types";
import { useCallback } from "react";

export type ExplorerOpenOptions = {
  newTab?: boolean;
};

export function useExplorer(listing: MediaListing) {
  const openFolder = useCallback(
    (path: string, at?: IndexLike, options?: ExplorerOpenOptions) => {
      const query = { at };
      const queryOpts = { path, history: "push" as const };

      if (options?.newTab) {
        const url = getExplorerUrl(query, queryOpts);
        window.open(url, "_blank", "noreferrer");
      } else {
        setExplorerQuery(query, queryOpts);
      }
    },
    [getExplorerUrl, setExplorerQuery]
  );

  const openNextFolder = useCallback(
    (at: IndexLike, options?: ExplorerOpenOptions) => {
      if (listing.next == null) return;
      openFolder(listing.next, at, options);
    },
    [listing.next, openFolder]
  );

  const openPrevFolder = useCallback(
    (at: IndexLike, options?: ExplorerOpenOptions) => {
      if (listing.prev == null) return;
      openFolder(listing.prev, at, options);
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
