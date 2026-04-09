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
import { createSearchFilter } from "@/lib/media/filters";
import { isMedia } from "@/lib/media/media-types";
import {
  MediaNode,
  MediaNodeFilter,
  MediaPathToIndexMap,
  MediaPathToNodeMap,
} from "@/lib/media/types";
import { normalizeIndex } from "@/lib/query/utils";
import { PagingProvider } from "@/providers/paging-provider";
import { usePathSelectionContext } from "@/providers/path-selection-provider";
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
import { AnimatePresence } from "framer-motion";
import { MoreVertical, RotateCcw, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

  // フィルタ関数
  const searchFilterFn = useMemo(() => createSearchFilter(query), [query]);

  // フィルタリング結果
  const filteredNodes = useMemo(() => {
    const { nodes: allNodes } = listing;

    // 各フィルタの生成
    const filters: MediaNodeFilter[] = [searchFilterFn];

    // フィルタの適用
    return allNodes.filter((node) => {
      if (node.isDirectory) {
        // フォルダは検索クエリには反応させるが、タグやお気に入りフィルタからは除外する
        return searchFilterFn(node);
      }

      // メディアファイルは全てのフィルタを適用
      return filters.every((fn) => fn(node));
    });
  }, [listing, searchFilterFn]);

  // 「メディアのみ」のリスト
  const mediaOnly = useMemo(
    () => filteredNodes.filter((n) => isMedia(n.type)),
    [filteredNodes]
  );

  // ===== ビューア =====

  // ビューア用インデックスを計算するためのマップ
  const viewerIndexMap: MediaPathToIndexMap = useMemo(
    () => new Map(mediaOnly.map((n, index) => [n.path, index])),
    [mediaOnly]
  );

  // ビューア用インデックスを取得
  const getViewerIndex = useCallback(
    (path: string) => {
      if (viewerIndexMap.has(path)) return viewerIndexMap.get(path)!;
      return null;
    },
    [viewerIndexMap]
  );

  // ビューア用インデックス
  const viewerIndex = useMemo(
    () => (at != null ? normalizeIndex(at, mediaOnly.length) : null),
    [at, mediaOnly.length]
  );

  // ビューア起動モード
  const isViewMode = modal && viewerIndex != null && !!mediaOnly[viewerIndex];

  // 直前のインデックス
  const [lastPath, setLastPath] = useState<string | null>(null);

  // ビューアスライド移動時の処理
  const handleViewerIndexChange = (index: number) => {
    const media = mediaOnly[index];
    if (!media) return;
    selectPaths([media.path]);
    setLastPath(media.path);
  };

  // ===== ナビゲーション =====

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

  const {
    isSelectionMode,
    enterSelectionMode,
    exitSelectionMode,
    selectedPaths,
    selectPaths,
    clearSelection,
  } = usePathSelectionContext();

  // 処理高速化のため、path => node の Map を作成しておく
  const pathToNodeMap: MediaPathToNodeMap = useMemo(() => {
    return new Map(listing.nodes.map((node) => [node.path, node]));
  }, [listing.nodes]);

  // 選択済みノードリスト
  const selected = useMemo(() => {
    const result = [];
    for (const path of selectedPaths) {
      const node = pathToNodeMap.get(path);
      if (node) result.push(node);
    }
    return result;
  }, [pathToNodeMap, selectedPaths]);

  // 全選択
  const handleSelectAll = () => {
    selectPaths(filteredNodes.map((n) => n.path));
    enterSelectionMode();
  };

  // 選択解除
  const handleClearSelection = () => {
    clearSelection();
    exitSelectionMode();
  };

  // 選択バー閉じる
  const handleCloseSelectionBar = () => {
    clearSelection();
    exitSelectionMode();
  };

  // ===== 復元 (Restore) =====

  const [restoreTargets, setRestoreTargets] = useState<MediaNode[]>([]);
  const isRestoreMode = restoreTargets.length > 0;

  // 復元実行
  const handleRestoreConfirm = async () => {
    const paths = restoreTargets.map((n) => n.path);
    const result = await restoreNodesAction(paths);

    if (result.failed === 0) {
      toast.success(`${result.success}件のアイテムを復元しました`);
      clearSelection(); // 選択中だった場合は解除
    } else {
      toast.error(`${result.failed}件の復元に失敗しました`);
    }
  };

  // 単体復元の呼び出し用
  const handleOpenRestoreSingle = (node: MediaNode) => {
    setRestoreTargets([node]);
  };

  // 一括復元の呼び出し用 (SelectionBarから)
  const handleOpenRestoreSelected = () => {
    setRestoreTargets(selected);
  };

  // ===== 削除 (Delete) =====

  const [deleteTargets, setDeleteTargets] = useState<MediaNode[]>([]);
  const isDeleteMode = deleteTargets.length > 0;

  // 削除実行
  const handleDeleteConfirm = async () => {
    const paths = deleteTargets.map((n) => n.path);
    const result = await deleteNodesPermanentlyAction(paths);

    if (result.failed === 0) {
      toast.success(`${result.success}件のアイテムを完全に削除しました`);
      clearSelection(); // 選択中だった場合は解除
    } else {
      toast.error(`${result.failed}件の削除に失敗しました`);
    }
  };

  // 単体削除の呼び出し用
  const handleOpenDeleteSingle = (node: MediaNode) => {
    setDeleteTargets([node]);
  };

  // 一括削除の呼び出し用 (SelectionBarから)
  const handleOpenDeleteSelected = () => {
    setDeleteTargets(selected);
  };

  // ===== ショートカット =====

  const { enableScope, disableScope } = useHotkeysContext();

  const allScopes = useMemo(
    () => ["trash-main", "tag-editor", "viewer", "dialog"] as const,
    []
  );

  const activeScope = useMemo<(typeof allScopes)[number]>(() => {
    if (isViewMode) return "viewer";
    return "trash-main";
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
  useHotkeys("escape", () => handleClearSelection(), {
    scopes: "trash-main",
  });
  useHotkeys("delete", () => handleOpenDeleteSelected(), {
    scopes: "trash-main",
  });
  useHotkeys(
    "ctrl+a",
    (e) => {
      e.preventDefault();
      handleSelectAll();
    },
    { scopes: "trash-main" }
  );
  useHotkeys(
    "ctrl+k",
    (e) => {
      e.preventDefault();
      focusSearch();
    },
    { scopes: "trash-main" }
  );

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
            <PagingGridView
              allNodes={filteredNodes}
              initialScrollPath={lastPath}
              onOpen={handleOpen}
              onDeletePermanently={handleOpenDeleteSingle}
              onRestore={handleOpenRestoreSingle}
            />
          </div>
        )}

        {/* リストビュー */}
        {viewMode === "list" && (
          <div className="flex-1">
            <PagingListView
              allNodes={filteredNodes}
              initialScrollPath={lastPath}
              onOpen={handleOpen}
              onDeletePermanently={handleOpenDeleteSingle}
              onRestore={handleOpenRestoreSingle}
            />
          </div>
        )}

        {/* ビューワ */}
        {isViewMode && (
          <ScrollLockProvider>
            <MediaViewer
              allNodes={mediaOnly}
              initialIndex={viewerIndex}
              onIndexChange={handleViewerIndexChange}
              onClose={closeViewer}
              onPrevFolder={
                listing.prev ? (at) => openPrevFolder(at ?? "last") : undefined
              }
              onNextFolder={
                listing.next ? (at) => openNextFolder(at ?? "first") : undefined
              }
              onDelete={handleOpenDeleteSelected}
            />
          </ScrollLockProvider>
        )}

        {/* 選択バー */}
        <AnimatePresence>
          {isSelectionMode && (
            <SelectionBar
              count={selected.length}
              totalCount={filteredNodes.length}
              onSelectAll={handleSelectAll}
              onClose={handleCloseSelectionBar}
              className="z-40" // DropdownMenu より小さくする
              actions={
                <div className="flex gap-1 items-center">
                  {/* その他 */}
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
          )}
        </AnimatePresence>

        {/* 削除確認ダイアログ */}
        <DeleteConfirmDialog
          open={isDeleteMode}
          onOpenChange={(open) => !open && setDeleteTargets([])}
          count={deleteTargets.length}
          onConfirm={handleDeleteConfirm}
          permanent
        />

        {/* 復元確認ダイアログ */}
        <RestoreConfirmDialog
          open={isRestoreMode}
          onOpenChange={(open) => !open && setRestoreTargets([])}
          count={restoreTargets.length}
          onConfirm={handleRestoreConfirm}
        />

        {/* フォルダナビゲーション */}
        <FolderNavigation prevHref={listing.prev} nextHref={listing.next} />
      </div>
    </PagingProvider>
  );
}
