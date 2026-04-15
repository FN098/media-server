"use client";

import { useExplorerQuery } from "@/hooks/use-explorer-query";
import { MediaListing } from "@/lib/media/types";
import { IndexLike } from "@/lib/query/types";
import { useCallback } from "react";

export type ExplorerOpenOptions = {
  newTab?: boolean;
};

export function useExplorer(listing: MediaListing) {
  const { setExplorerQuery, getExplorerUrl } = useExplorerQuery();

  const openViewer = useCallback(
    (at: IndexLike, options?: ExplorerOpenOptions) => {
      const query = { modal: true, at };
      if (options?.newTab) {
        const url = getExplorerUrl(query);
        window.open(url, "_blank", "noreferrer");
      } else {
        setExplorerQuery(query, { history: "push" });
      }
    },
    [getExplorerUrl, setExplorerQuery]
  );

  const closeViewer = useCallback(() => {
    setExplorerQuery({ modal: false, at: null }, { history: "push" });
  }, [setExplorerQuery]);

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
