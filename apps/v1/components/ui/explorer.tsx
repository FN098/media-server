"use client";

import { GridView } from "@/components/ui/grid-view-v2";
import { ListView } from "@/components/ui/list-view";
import { MediaViewer } from "@/components/ui/media-viewer";
import { useModalNavigation } from "@/hooks/use-modal-navigation";
import { visitFolder } from "@/lib/folder/actions";
import { isMedia } from "@/lib/media/detector";
import { MediaListing, MediaNode } from "@/lib/media/types";
import { getClientExplorerPath } from "@/lib/path-helpers";
import { FavoriteProvider } from "@/providers/favorite-provider";
import { useSearch } from "@/providers/search-provider";
import { useViewMode } from "@/providers/view-mode-provider";
import { cn } from "@/shadcn/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type ExplorerProps = {
  listing: MediaListing;
};

export function Explorer({ listing }: ExplorerProps) {
  const { query } = useSearch();
  const { view } = useViewMode();
  const router = useRouter();
  const [initialIndex, setInitialIndex] = useState(0);

  // Media filter
  const lowerQuery = useMemo(() => query.toLowerCase(), [query]);
  const filtered = useMemo(() => {
    return listing.nodes
      .filter((e) => e.isDirectory || isMedia(e.type))
      .filter((e) => e.name.toLowerCase().includes(lowerQuery));
  }, [listing.nodes, lowerQuery]);

  // Modal config
  const { isOpen, openModal, closeModal } = useModalNavigation();

  // Open file/folder
  const handleOpen = useCallback(
    async (node: MediaNode, index: number) => {
      if (node.isDirectory) {
        await visitFolder(node.path);
        const href = getClientExplorerPath(node.path);
        router.push(href);
        return;
      }

      if (isMedia(node.type)) {
        openModal();
        setInitialIndex(index);
        return;
      }

      toast.warning("このファイル形式は対応していません");
    },
    [openModal, router]
  );

  // Favorites
  const initialFavorites = useMemo(
    () => Object.fromEntries(filtered.map((n) => [n.path, n.isFavorite])),
    [filtered]
  );

  // Open next/prev folder
  const handleFolderNavigation = (
    targetPath: string,
    mode: "first" | "last"
  ) => {
    const href = `${getClientExplorerPath(targetPath)}?auto=${mode}`;
    router.push(href);
  };

  const searchParams = useSearchParams();
  const autoMode = searchParams.get("auto");

  // 自動起動ロジック
  useEffect(() => {
    if (!autoMode) return;

    const mediaNodes = filtered.filter((n) => isMedia(n.type));
    if (mediaNodes.length === 0) return;

    const targetIndex =
      autoMode === "first"
        ? filtered.indexOf(mediaNodes[0])
        : filtered.indexOf(mediaNodes[mediaNodes.length - 1]);

    setTimeout(() => {
      openModal();
      setInitialIndex(targetIndex);

      // クエリを消す（リロード対策）
      const url = new URL(window.location.href);
      if (url.searchParams.has("auto")) {
        url.searchParams.delete("auto");
        window.history.replaceState(null, "", url.pathname + url.search);
      }
    }, 0);
  }, [autoMode, filtered, handleOpen, listing.path, openModal, router]);

  return (
    <div
      className={cn(
        "flex-1 overflow-auto",
        view === "grid" && "p-4",
        view === "list" && "px-4"
      )}
    >
      <FavoriteProvider initialFavorites={initialFavorites}>
        <div className={cn(view === "grid" ? "block" : "hidden")}>
          <GridView
            nodes={filtered}
            onOpen={(node, index) => void handleOpen(node, index)}
          />
        </div>

        <div
          className={cn(view === "list" ? "block" : "hidden", "w-full h-full")}
        >
          <ListView nodes={filtered} onOpen={void handleOpen} />
        </div>

        {isOpen && (
          <MediaViewer
            items={filtered}
            initialIndex={initialIndex}
            onClose={closeModal}
            openFolderMenu={false}
            onPrevFolder={
              listing.prev
                ? () => handleFolderNavigation(listing.prev!, "last")
                : undefined
            }
            onNextFolder={
              listing.next
                ? () => handleFolderNavigation(listing.next!, "first")
                : undefined
            }
          />
        )}
      </FavoriteProvider>
    </div>
  );
}
