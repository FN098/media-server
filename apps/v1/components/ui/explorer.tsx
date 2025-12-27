"use client";

import { GridView } from "@/components/ui/grid-view-v2";
import { ListView } from "@/components/ui/list-view";
import { MediaViewer } from "@/components/ui/media-viewer";
import {
  useAutoOpenViewer,
  useFolderNavigation,
} from "@/hooks/use-auto-open-viewer";
import { useModalNavigation } from "@/hooks/use-modal-navigation";
import { isMedia } from "@/lib/media/detector";
import { MediaListing, MediaNode } from "@/lib/media/types";
import { getClientExplorerPath } from "@/lib/path-helpers";
import { enqueueThumbJob } from "@/lib/thumb/actions";
import { FavoriteProvider } from "@/providers/favorite-provider";
import { useSearch } from "@/providers/search-provider";
import { useViewMode } from "@/providers/view-mode-provider";
import { Button } from "@/shadcn/components/ui/button";
import { cn } from "@/shadcn/lib/utils";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

  const mediaOnly = useMemo(
    () => filtered.filter((e) => isMedia(e.type)),
    [filtered]
  );

  const mediaOnlyIndexMap = useMemo(
    () => new Map(mediaOnly.map((e, index) => [e, index])),
    [mediaOnly]
  );

  // Modal config
  const { isOpen, openModal, closeModal } = useModalNavigation();

  // Open file/folder
  const handleOpen = useCallback(
    (node: MediaNode) => {
      if (node.isDirectory) {
        const href = getClientExplorerPath(node.path);
        router.push(href);
        return;
      }

      if (isMedia(node.type)) {
        const mediaIndex = mediaOnlyIndexMap.get(node) ?? 0;
        openModal();
        setInitialIndex(mediaIndex);
        return;
      }

      toast.warning("このファイル形式は対応していません");
    },
    [mediaOnlyIndexMap, openModal, router]
  );

  // Favorites
  const initialFavorites = useMemo(
    () => Object.fromEntries(filtered.map((n) => [n.path, n.isFavorite])),
    [filtered]
  );

  // Open next/prev folder
  const { handleFolderNavigation } = useFolderNavigation();

  // Auto open viewer
  useAutoOpenViewer(mediaOnly.length, (index) => {
    openModal();
    setInitialIndex(index);
  });

  // Create thumbnails on background job
  useEffect(() => {
    void enqueueThumbJob(listing.path);
  }, [listing.path]);

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
          <GridView nodes={filtered} onOpen={(node) => void handleOpen(node)} />
        </div>

        <div className={cn(view === "list" ? "block" : "hidden")}>
          <ListView nodes={filtered} onOpen={(node) => void handleOpen(node)} />
        </div>

        {isOpen && (
          <MediaViewer
            items={mediaOnly}
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
                <Link href={encodeURI(getClientExplorerPath(listing.prev))}>
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
                <Link href={encodeURI(getClientExplorerPath(listing.next))}>
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
