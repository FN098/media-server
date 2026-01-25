"use client";

import {
  deleteNodesPermanentlyAction,
  restoreNodesAction,
} from "@/actions/media-actions";
import { SelectionBar } from "@/components/ui/bars/selection-bar";
import { DeleteConfirmDialog } from "@/components/ui/dialogs/delete-confirm-dialog";
import { RestoreConfirmDialog } from "@/components/ui/dialogs/restore-confirm-dialog";
import { FolderNavigation } from "@/components/ui/navigations/folder-navigation";
import { PagingGridView } from "@/components/ui/views/paging-grid-view";
import { PagingListView } from "@/components/ui/views/paging-list-view";
import { useShortcutKeys } from "@/hooks/use-shortcut-keys";
import { useTagFilter } from "@/hooks/use-tag-filter";
import {
  useNormalizeTrashQuery,
  useSetTrashQuery,
  useTrashQuery,
} from "@/hooks/use-trash-query";
import { createSearchFilter, createTagFilter } from "@/lib/media/filters";
import {
  MediaNode,
  MediaNodeFilter,
  MediaPathToNodeMap,
} from "@/lib/media/types";
import { ExplorerQuery } from "@/lib/query/types";
import { PagingProvider } from "@/providers/paging-provider";
import { usePathSelectionContext } from "@/providers/path-selection-provider";
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
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

export function Trash() {
  const { listing, openFolder } = useTrashContext();

  // ===== URL ステート =====

  // URLファーストのステート管理
  const setTrashQuery = useSetTrashQuery();
  const { view, q } = useTrashQuery(); // URL
  const { focus: focusSearch, query, setQuery } = useSearchContext(); // ヘッダーUI
  const { viewMode, setViewMode } = useViewModeContext(); // ヘッダーUI

  // 初期同期：URL → Context（1回だけ）
  useEffect(() => {
    if (view !== viewMode) setViewMode(view);
    if (q !== query) setQuery(q ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // UI操作：Context → URL
  useEffect(() => {
    const patch: Partial<ExplorerQuery> = {};

    // undefined と空文字列の比較にならないように normalize しておく
    const nq = q ?? "";
    const nQuery = query ?? "";

    if (view !== viewMode) patch.view = viewMode;
    if (nq !== nQuery) patch.q = nQuery || undefined;

    if (Object.keys(patch).length === 0) return;

    setTrashQuery(patch);
  }, [setTrashQuery, q, query, view, viewMode]);

  // クエリパラメータ正規化
  useNormalizeTrashQuery();

  // ===== フィルタリング =====

  // タグフィルタ
  const tagFilter = useTagFilter();

  // フィルタ関数
  const searchFilterFn = useMemo(() => createSearchFilter(query), [query]);
  const tagFilterFn = useMemo(
    () => createTagFilter(Array.from(tagFilter.selectedTags), tagFilter.mode),
    [tagFilter]
  );

  // フィルタリング結果
  const filteredNodes = useMemo(() => {
    const { nodes: allNodes } = listing;

    // 各フィルタの生成
    const filters: MediaNodeFilter[] = [searchFilterFn, tagFilterFn];

    // フィルタの適用
    return allNodes.filter((node) => {
      if (node.isDirectory) {
        // フォルダは検索クエリには反応させるが、タグやお気に入りフィルタからは除外する
        return searchFilterFn(node);
      }

      // メディアファイルは全てのフィルタを適用
      return filters.every((fn) => fn(node));
    });
  }, [listing, searchFilterFn, tagFilterFn]);

  // ===== ナビゲーション =====

  // ファイル/フォルダオープン
  const handleOpen = (node: MediaNode) => {
    if (node.isDirectory) {
      openFolder(node.path);
      return;
    }
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

  // ===== その他 =====

  // ショートカット
  useShortcutKeys([
    { key: "Ctrl+a", callback: () => handleSelectAll() },
    { key: "Ctrl+k", callback: () => focusSearch() },
    { key: "Escape", callback: () => handleClearSelection() },
  ]);

  // スクロール対象のref
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className={cn(
        "flex-1 flex flex-col min-h-0 overflow-auto focus:outline-none"
      )}
      ref={scrollRef}
      tabIndex={-1}
    >
      {/* グリッドビュー */}
      {viewMode === "grid" && (
        <PagingProvider totalItems={filteredNodes.length} defaultPageSize={48}>
          <div className="flex-1">
            <PagingGridView
              allNodes={filteredNodes}
              onOpen={handleOpen}
              onDeletePermanently={handleOpenDeleteSingle}
              onRestore={handleOpenRestoreSingle}
              onPageChange={() =>
                scrollRef.current?.scrollTo({ top: 0, behavior: "instant" })
              }
            />
          </div>
        </PagingProvider>
      )}

      {/* リストビュー */}
      {viewMode === "list" && (
        <PagingProvider totalItems={filteredNodes.length} defaultPageSize={100}>
          <div className="flex-1">
            <PagingListView
              allNodes={filteredNodes}
              onOpen={handleOpen}
              onDeletePermanently={handleOpenDeleteSingle}
              onRestore={handleOpenRestoreSingle}
              onPageChange={() =>
                scrollRef.current?.scrollTo({ top: 0, behavior: "instant" })
              }
            />
          </div>
        </PagingProvider>
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
  );
}
