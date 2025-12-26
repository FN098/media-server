"use client";

import { GridView } from "@/components/ui/grid-view-v2";
import { ListView } from "@/components/ui/list-view";
import { MediaViewer } from "@/components/ui/media-viewer";
import { useModalNavigation } from "@/hooks/use-modal-navigation";
import { isMedia } from "@/lib/media/detector";
import { MediaListing, MediaNode } from "@/lib/media/types";
import { getClientExplorerPath } from "@/lib/path-helpers";
import { FavoriteProvider } from "@/providers/favorite-provider";
import { useSearch } from "@/providers/search-provider";
import { useViewMode } from "@/providers/view-mode-provider";
import { Button } from "@/shadcn/components/ui/button";
import { cn } from "@/shadcn/lib/utils";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
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
    (node: MediaNode, index: number) => {
      if (node.isDirectory) {
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
  const handleFolderNavigation = useCallback(
    (targetPath: string, mode?: "first" | "last") => {
      const baseUrl = getClientExplorerPath(targetPath);
      const params = new URLSearchParams();

      if (mode) {
        params.append("auto", mode);
      }

      const queryString = params.toString();
      const href = queryString ? `${baseUrl}?${queryString}` : baseUrl;
      router.push(href);
    },
    [router]
  );

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

        {/* フォルダナビゲーション */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-8 border-t border-border/30">
          {/* Previous Button Container */}
          <div className="w-full sm:flex-1">
            {listing.prev && (
              <Button
                variant="outline"
                className="group flex flex-col items-start gap-1 h-auto py-4 px-6 w-full sm:max-w-[280px] hover:bg-accent transition-all"
                asChild
              >
                <Link href={getClientExplorerPath(listing.prev)}>
                  <div className="flex items-center text-xs text-muted-foreground group-hover:text-primary">
                    <ArrowLeft className="mr-1 h-3 w-3" />
                    Previous
                  </div>
                  <div className="text-base font-medium truncate w-full text-left">
                    {listing.prev.split("/").filter(Boolean).pop()}
                  </div>
                </Link>
              </Button>
            )}
          </div>

          {/* Next Button Container */}
          <div className="w-full sm:flex-1 flex justify-end">
            {listing.next && (
              <Button
                variant="outline"
                className="group flex flex-col items-end gap-1 h-auto py-4 px-6 w-full sm:max-w-[280px] hover:bg-accent transition-all"
                asChild
              >
                <Link href={getClientExplorerPath(listing.next)}>
                  <div className="flex items-center text-xs text-muted-foreground group-hover:text-primary">
                    Next
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </div>
                  <div className="text-base font-medium truncate w-full text-right">
                    {listing.next.split("/").filter(Boolean).pop()}
                  </div>
                </Link>
              </Button>
            )}
          </div>
        </div>
      </FavoriteProvider>
    </div>
  );
}
