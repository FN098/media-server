"use client";

import {
  deleteNodesPermanentlyAction,
  restoreNodesAction,
} from "@/actions/media-actions";
import { SelectionBar } from "@/components/ui/bars/selection-bar";
import { DeleteConfirmDialog } from "@/components/ui/dialogs/delete-confirm-dialog";
import { RestoreConfirmDialog } from "@/components/ui/dialogs/restore-confirm-dialog";
import { FolderNavigation } from "@/components/ui/navigations/folder-navigation";
import { MediaViewer } from "@/components/ui/viewers/media-viewer";
import { PagingGridView } from "@/components/ui/views/paging-grid-view";
import { PagingListView } from "@/components/ui/views/paging-list-view";
import { useExplorerQuery } from "@/hooks/use-explorer-query";
import { useFilters } from "@/hooks/use-filters";
import { useSelectionControl } from "@/hooks/use-selection-control";
import { useViewerControl } from "@/hooks/use-viewer-control";
import { isMedia } from "@/lib/media/media-types";
import { MediaNode } from "@/lib/media/types";
import { IndexLike } from "@/lib/query/types";
import { ActionsProvider } from "@/providers/actions-provider";
import { PagingProvider } from "@/providers/paging-provider";
import { ScrollLockProvider } from "@/providers/scroll-lock-provider";
import { useSearchContext } from "@/providers/search-provider";
import { useTrashContext } from "@/providers/trash-provider";
import { useViewModeContext } from "@/providers/view-mode-provider";
import { Button } from "@/shadcn/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shadcn/components/ui/dropdown-menu";
import { cn } from "@/shadcn/lib/utils";
import { MoreVertical, RotateCcw, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useHotkeys, useHotkeysContext } from "react-hotkeys-hook";
import { toast } from "sonner";

export function Trash() {
  const {
    listing,
    openViewer,
    closeViewer,
    openFolder,
    openNextFolder,
    openPrevFolder,
  } = useTrashContext();

  // 前のフォルダを開く
  const handleOpenPrevFolder = (at: IndexLike = "last") => {
    openPrevFolder(at);
  };

  // 次のフォルダを開く
  const handleOpenNextFolder = (at: IndexLike = "first") => {
    openNextFolder(at);
  };

  // ===== URL ステート =====

  // URLファーストのステート管理
  const { explorerQuery, setExplorerQuery } = useExplorerQuery();
  const { view, q, at, modal } = explorerQuery; // URL
  const { focus: focusSearch, query, setQuery } = useSearchContext(); // ヘッダーUI
  const { viewMode, setViewMode } = useViewModeContext(); // ヘッダーUI

  // 初期同期：URL → Context（1回だけ）
  useEffect(() => {
    if (view !== viewMode) setViewMode(view ?? "grid");
    if (q !== query) setQuery(q ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // UI操作：Context → URL
  useEffect(() => {
    const hasChanged =
      query.trim() !== (q || "") || viewMode !== (view || "grid");

    if (hasChanged) {
      setExplorerQuery(
        {
          q: query.trim() === "" ? undefined : query,
          view: viewMode === "grid" ? undefined : viewMode,
        },
        {
          deleted: true,
        }
      );
    }
  }, [setExplorerQuery, query, viewMode, q, view]);

  // ===== フィルタリング =====

  const allNodes = listing.nodes;

  const { filteredNodes, mediaOnly } = useFilters({
    allNodes,
    query,
    activated: true,
  });

  // ===== ビューア =====

  const { initialIndex, getViewerIndex, isViewMode, lastPath, setLastPath } =
    useViewerControl({
      mediaOnly,
      at,
      modal,
    });

  // ビューアスライド移動時の処理
  const handleViewerIndexChange = (index: number) => {
    const media = mediaOnly[index];
    if (!media) return;
    select(media);
    setLastPath(media.path);
  };

  // ===== ナビゲーション =====

  // ファイル/フォルダオープン
  const handleOpen = (node: MediaNode) => {
    if (node.isDirectory) {
      openFolder(node.path);
      return;
    }

    if (isMedia(node.type)) {
      const index = getViewerIndex(node.path);
      if (index == null) return;
      openViewer(index);
      return;
    }

    toast.warning("このファイル形式は対応していません");
  };

  // ===== 選択機能 =====

  const { isSelectionMode, selected, select, selectAll, resetSelection } =
    useSelectionControl({
      allNodes,
      controlledNodes: filteredNodes,
    });

  // ===== 復元 (Restore) =====

  const [restoreTargets, setRestoreTargets] = useState<MediaNode[]>([]);
  const isRestoreMode = restoreTargets.length > 0;

  // 復元実行
  const handleRestoreConfirm = async () => {
    const paths = restoreTargets.map((n) => n.path);
    const result = await restoreNodesAction(paths);

    if (result.failed === 0) {
      toast.success(`${result.success}件のアイテムを復元しました`);
      resetSelection();
    } else {
      toast.error(`${result.failed}件の復元に失敗しました`);
    }
  };

  // 単体復元
  const handleOpenRestoreSingle = (node: MediaNode) => {
    setRestoreTargets([node]);
  };

  // 一括復元
  const handleOpenRestoreSelected = () => {
    setRestoreTargets(selected);
  };

  // 後始末
  const handleRestoreDialogOpenChange = (open: boolean) => {
    if (!open) {
      setRestoreTargets([]);
    }
  };

  // ===== 削除 =====

  const [deleteTargets, setDeleteTargets] = useState<MediaNode[]>([]);
  const isDeleteMode = deleteTargets.length > 0;

  // 単体削除
  const handleOpenDeleteSingle = (node: MediaNode) => {
    setDeleteTargets([node]);
  };

  // 一括削除
  const handleOpenDeleteSelected = () => {
    setDeleteTargets(selected);
  };

  // 削除実行
  const handleDeleteConfirm = async () => {
    const paths = deleteTargets.map((n) => n.path);
    const result = await deleteNodesPermanentlyAction(paths);

    if (result.failed === 0) {
      toast.success(`${result.success}件のアイテムを完全に削除しました`);
      resetSelection();
    } else {
      toast.error(`${result.failed}件の削除に失敗しました`);
    }
  };

  // 後始末
  const handleDeleteDialogOpenChange = (open: boolean) => {
    if (!open) {
      setDeleteTargets([]);
    }
  };

  // ===== ショートカット =====

  // スコープを切り替えるフック
  const { enableScope, disableScope } = useHotkeysContext();

  // ショートカットを利用可能なスコープ
  const allScopes = useMemo(
    () => ["trash", "tag-editor", "viewer", "dialog"] as const,
    []
  );

  // 現在のスコープ
  const activeScope = useMemo<(typeof allScopes)[number]>(() => {
    if (isViewMode) return "viewer";
    return "trash";
  }, [isViewMode]);

  // デバッグ用
  useEffect(() => console.debug({ activeScope }), [activeScope]);

  // スコープの排他的制御
  useEffect(() => {
    // 該当スコープを有効にし、それ以外を無効にする
    allScopes.forEach((s) => {
      if (s === activeScope) {
        enableScope(s);
      } else {
        disableScope(s);
      }
    });
  }, [activeScope, allScopes, disableScope, enableScope]);

  // ショートカットの定義
  // Escape: 選択解除
  // Delete: 削除
  // Ctrl + A: 全選択
  // Ctrl + K: 検索
  // P/N: 前/次のフォルダを開く
  useHotkeys("escape", () => resetSelection(), {
    scopes: "trash",
  });
  useHotkeys("delete", () => handleOpenDeleteSelected(), {
    scopes: "trash",
  });
  useHotkeys(
    "ctrl+a",
    (e) => {
      e.preventDefault();
      selectAll();
    },
    { scopes: "trash" }
  );
  useHotkeys(
    "ctrl+k",
    (e) => {
      e.preventDefault();
      focusSearch();
    },
    { scopes: "trash" }
  );
  useHotkeys("p", () => handleOpenPrevFolder("first"), {
    scopes: ["trash", "viewer"],
  });
  useHotkeys("n", () => handleOpenNextFolder("first"), {
    scopes: ["trash", "viewer"],
  });

  // ===== その他 =====

  // スクロール対象のref
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <PagingProvider
      totalItems={filteredNodes.length}
      options={{
        defaultPageSize: 48,
        useUrlParams: true,
      }}
    >
      <div
        className={cn(
          "flex-1 flex flex-col min-h-0 overflow-auto focus:outline-none"
        )}
        ref={scrollRef}
        tabIndex={-1}
      >
        {/* グリッドビュー */}
        {viewMode === "grid" && (
          <div className="flex-1">
            <ActionsProvider
              actions={{
                open: handleOpen,
                deletePermanently: handleOpenDeleteSingle,
                restore: handleOpenRestoreSingle,
              }}
            >
              <PagingGridView
                allNodes={filteredNodes}
                initialScrollPath={lastPath}
              />
            </ActionsProvider>
          </div>
        )}

        {/* リストビュー */}
        {viewMode === "list" && (
          <div className="flex-1">
            <ActionsProvider
              actions={{
                open: handleOpen,
                deletePermanently: handleOpenDeleteSingle,
                restore: handleOpenRestoreSingle,
              }}
            >
              <PagingListView
                allNodes={filteredNodes}
                initialScrollPath={lastPath}
              />
            </ActionsProvider>
          </div>
        )}

        {/* ビューワ */}
        {isViewMode && (
          <ScrollLockProvider>
            <MediaViewer
              allNodes={mediaOnly}
              initialIndex={initialIndex}
              onIndexChange={handleViewerIndexChange}
              onClose={closeViewer}
              onPrevFolder={listing.prev ? handleOpenPrevFolder : undefined}
              onNextFolder={listing.next ? handleOpenNextFolder : undefined}
              onDelete={handleOpenDeleteSelected}
            />
          </ScrollLockProvider>
        )}

        {/* 選択バー */}
        <SelectionBar
          open={isSelectionMode}
          count={selected.length}
          totalCount={filteredNodes.length}
          onSelectAll={selectAll}
          onClose={resetSelection}
          className="z-40"
          actions={
            <div className="flex gap-1 items-center">
              {/* その他のアクション */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost">
                    <MoreVertical size={18} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    variant="default"
                    onClick={handleOpenRestoreSelected}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    復元
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={handleOpenDeleteSelected}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> 完全に削除
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          }
        />

        {/* 削除確認ダイアログ */}
        <DeleteConfirmDialog
          open={isDeleteMode}
          onConfirm={handleDeleteConfirm}
          onOpenChange={handleDeleteDialogOpenChange}
          count={deleteTargets.length}
          permanent
        />

        {/* 復元確認ダイアログ */}
        <RestoreConfirmDialog
          open={isRestoreMode}
          onConfirm={handleRestoreConfirm}
          onOpenChange={handleRestoreDialogOpenChange}
          count={restoreTargets.length}
        />

        {/* フォルダナビゲーション */}
        <FolderNavigation prevHref={listing.prev} nextHref={listing.next} />
      </div>
    </PagingProvider>
  );
}
