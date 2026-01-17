"use client";

import { useSetTrashQuery } from "@/hooks/use-trash-query";
import { MediaListing } from "@/lib/media/types";
import { IndexLike } from "@/lib/query/types";
import { useCallback } from "react";

export function useTrash(listing: MediaListing) {
  const setTrashQuery = useSetTrashQuery();

  const openViewer = useCallback(
    (at: IndexLike) => {
      setTrashQuery({ modal: true, at }, { history: "push" });
    },
    [setTrashQuery]
  );

  const closeViewer = useCallback(() => {
    setTrashQuery({ modal: false, at: null }, { history: "push" });
  }, [setTrashQuery]);

  const openFolder = useCallback(
    (path: string, at?: IndexLike) => {
      setTrashQuery({ at: at ?? null, q: "" }, { path, history: "push" });
    },
    [setTrashQuery]
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
