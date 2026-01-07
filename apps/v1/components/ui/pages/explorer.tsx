"use client";

import { visitFolderAction } from "@/actions/folder-actions";
import { enqueueThumbJob } from "@/actions/thumb-actions";
import { SelectionBar } from "@/components/ui/bars/selection-bar";
import { FavoriteFilterButton } from "@/components/ui/buttons/favorite-filter-button";
import { TagFilterDialog } from "@/components/ui/dialogs/tag-filter-dialog";
import { TagEditSheet } from "@/components/ui/sheets/tag-edit-sheet";
import { MediaViewer } from "@/components/ui/viewers/media-viewer";
import { GridView } from "@/components/ui/views/grid-view";
import { ListView } from "@/components/ui/views/list-view";
import {
  useExplorerQuery,
  useNormalizeExplorerQuery,
  useSetExplorerQuery,
} from "@/hooks/use-explorer-query";
import { useShortcutKeys } from "@/hooks/use-shortcut-keys";
import { useTagFilter } from "@/hooks/use-tag-filter";
import { FavoritesRecord } from "@/lib/favorite/types";
import {
  createFavoriteFilter,
  createSearchFilter,
  createTagFilter,
} from "@/lib/media/filters";
import { isMedia } from "@/lib/media/media-types";
import { sortNames } from "@/lib/media/sort";
import {
  MediaNode,
  MediaNodeFilter,
  MediaPathToIndexMap,
} from "@/lib/media/types";
import { getClientExplorerPath } from "@/lib/path/helpers";
import { ExplorerQuery } from "@/lib/query/types";
import { normalizeIndex } from "@/lib/query/utils";
import { unique } from "@/lib/utils/unique";
import { useExplorerContext } from "@/providers/explorer-provider";
import { FavoritesProvider } from "@/providers/favorites-provider";
import { usePathSelectionContext } from "@/providers/path-selection-provider";
import { ScrollLockProvider } from "@/providers/scroll-lock-provider";
import { useSearchContext } from "@/providers/search-provider";
import { useTagEditorContext } from "@/providers/tag-editor-provider";
import { useViewModeContext } from "@/providers/view-mode-provider";
import { Button } from "@/shadcn/components/ui/button";
import { cn } from "@/shadcn/lib/utils";
import { AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, TagIcon } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

export function Explorer() {
  const {
    listing,
    openViewer,
    closeViewer,
    openFolder,
    openNextFolder,
    openPrevFolder,
  } = useExplorerContext();

  // ===== URL ステート =====

  // URLファーストのステート管理
  const setExplorerQuery = useSetExplorerQuery();
  const { view, q, at, modal } = useExplorerQuery(); // URL
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

    setExplorerQuery(patch);
  }, [q, query, setExplorerQuery, view, viewMode]);

  // クエリパラメータ正規化
  useNormalizeExplorerQuery();

  // ===== フィルタリング =====

  // フィルタリング対象タグ
  const { selectedTags, selectTags } = useTagFilter();

  // お気に入りのみ有効フラグ
  const [isFavoriteOnly, setIsFavoriteOnly] = useState(false);
  const toggleIsFavoriteOnly = () => setIsFavoriteOnly((prev) => !prev);

  // フィルタ関数
  const searchFilter = useMemo(() => createSearchFilter(query), [query]);
  const tagFilter = useMemo(
    () => createTagFilter(Array.from(selectedTags)),
    [selectedTags]
  );
  const favoriteFilter = useMemo(
    () => createFavoriteFilter(isFavoriteOnly),
    [isFavoriteOnly]
  );

  // フィルタリング結果
  const filteredNodes = useMemo(() => {
    const { nodes: allNodes } = listing;

    // 1. 各フィルタの生成
    const filters: MediaNodeFilter[] = [
      searchFilter,
      tagFilter,
      favoriteFilter,
    ];

    // 2. フィルタの適用
    return allNodes.filter((node) => {
      // フォルダは常に表示する場合 (検索にはヒットさせたい場合は条件を調整)
      if (node.isDirectory) {
        // 例: フォルダは検索クエリには反応させるが、タグやお気に入りフィルタからは除外する
        return searchFilter(node);
      }

      // メディアファイルは全てのフィルタを適用
      return filters.every((fn) => fn(node));
    });
  }, [listing, searchFilter, tagFilter, favoriteFilter]);

  // ビューアや選択機能で使う「メディアのみ」のリストは filteredNodes から抽出
  const mediaOnly = useMemo(
    () => filteredNodes.filter((n) => isMedia(n.type)),
    [filteredNodes]
  );

  // 処理高速化のため、path => node の Map を作成しておく
  const mediaOnlyMap = useMemo(() => {
    return new Map(mediaOnly.map((node) => [node.path, node]));
  }, [mediaOnly]);

  // すべてのタグ
  const allTags = sortNames(
    unique(
      mediaOnly
        .filter((n) => n.tags && n.tags.length > 0)
        .flatMap((n) => n.tags!.map((t) => t.name))
    )
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

  // 直前のインデックスを記憶するためのRef
  const lastViewerIndexRef = useRef<number | null>(null);

  // ビューアスライド移動時の処理
  const handleViewerIndexChange = (index: number) => {
    const media = mediaOnly[index];
    if (!media) return;

    // 選択状態の更新
    selectPaths([media.path]);

    // インデックス位置を覚えておく
    if (index !== null) {
      lastViewerIndexRef.current = index;
    }
  };

  // ビューアが閉じられた瞬間にスクロールを実行（ブラウザバック、閉じるボタン両方対応）
  useEffect(() => {
    // isViewModeがfalseになった、かつ直前のインデックスがある場合
    if (!isViewMode && lastViewerIndexRef.current !== null) {
      const index = lastViewerIndexRef.current;

      // 次のレンダリングサイクルで実行するためにsetTimeoutを使用
      const timer = setTimeout(() => {
        const element = document.getElementById(`media-item-${index}`);
        if (element) {
          element.scrollIntoView({
            behavior: "smooth", // または "auto"
            block: "center", // 画面中央に来るように調整
          });
        }
        // スクロール後はRefをクリア（任意）
        lastViewerIndexRef.current = null;
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isViewMode]);

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

  // ===== お気に入り =====

  // TODO: mediaOnly => listing.nodes に変更（フィルターの度に再計算しないようにする）
  // TODO: お気に入り変更時に更新 (ビューに onFavoriteChange を追加し、favoriteChanges に格納する。差分を保持する)
  const favorites: FavoritesRecord = useMemo(
    () => Object.fromEntries(mediaOnly.map((n) => [n.path, n.isFavorite])),
    [mediaOnly]
  );

  // ===== 選択機能 =====

  const {
    isSelectionMode,
    enterSelectionMode,
    exitSelectionMode,
    selectedPaths,
    selectPaths,
    clearSelection,
  } = usePathSelectionContext();

  // 選択済みノードリスト
  const selected = useMemo(() => {
    const result = [];
    for (const path of selectedPaths) {
      const node = mediaOnlyMap.get(path);
      if (node) result.push(node);
    }
    return result;
  }, [mediaOnlyMap, selectedPaths]);

  // 選択
  const handleSelect = useCallback(() => {
    // setIsTagEditorOpen(true);
  }, []);

  // 全選択
  const handleSelectAll = () => {
    selectPaths(mediaOnly.map((n) => n.path));
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

  // ===== タグエディタ =====

  const { isTagEditMode, setIsTagEditMode } = useTagEditorContext();
  const handleOpenTagEditor = () => {
    setIsTagEditMode(true);
  };
  const handleCloseTagEditor = () => {
    setIsTagEditMode(false);
  };
  const handleToggleTagEditor = () => {
    setIsTagEditMode((prev) => !prev);
  };

  // タグエディタの起動モード
  const tagEditMode = useMemo(() => {
    if (isViewMode) return "single";
    return "default";
  }, [isViewMode]);

  // ===== サーバーアクション =====

  // サムネイル作成リクエスト送信
  useEffect(() => {
    if (listing.path) {
      void enqueueThumbJob(listing.path);
    }
  }, [listing.path]);

  // 訪問済みフォルダ更新リクエスト送信
  useEffect(() => {
    if (listing.path) {
      void visitFolderAction(listing.path);
    }
  }, [listing.path]);

  // ===== その他 =====

  // ショートカット
  useShortcutKeys([
    { key: "t", callback: () => handleToggleTagEditor() },
    { key: "Ctrl+a", callback: () => handleSelectAll() },
    { key: "Ctrl+k", callback: () => focusSearch() },
    { key: "Escape", callback: () => handleClearSelection() },
  ]);

  return (
    <div
      className={cn(
        "flex-1 overflow-auto",
        viewMode === "grid" && "p-4",
        viewMode === "list" && "px-4"
        // isTagEditorOpen && "mb-[150px]"
      )}
    >
      <FavoritesProvider favorites={favorites}>
        <div className="flex flex-wrap items-center gap-1 pb-2">
          {/* タグフィルター */}
          <TagFilterDialog
            tags={allTags}
            selectedTags={selectedTags}
            onApply={selectTags}
          />

          {/* お気に入りフィルター */}
          <FavoriteFilterButton
            isActive={isFavoriteOnly}
            onClick={toggleIsFavoriteOnly}
            showCount
            count={mediaOnly.length}
          />
        </div>

        {/* グリッドビュー */}
        {viewMode === "grid" && !isViewMode && (
          <div>
            <GridView
              allNodes={filteredNodes}
              onOpen={handleOpen}
              onSelect={handleSelect}
            />
          </div>
        )}

        {/* リストビュー */}
        {viewMode === "list" && !isViewMode && (
          <div>
            <ListView
              allNodes={filteredNodes}
              onOpen={handleOpen}
              onSelect={handleSelect}
            />
          </div>
        )}

        {/* タグエディター */}
        <AnimatePresence>
          {isTagEditMode && (
            <TagEditSheet
              targetNodes={selected}
              onClose={handleCloseTagEditor}
              mode={tagEditMode}
              transparent={tagEditMode === "single"}
            />
          )}
        </AnimatePresence>

        {/* 選択バー */}
        <AnimatePresence>
          {isSelectionMode && !isTagEditMode && (
            <SelectionBar
              count={selected.length}
              totalCount={mediaOnly.length}
              onSelectAll={handleSelectAll}
              onClose={handleCloseSelectionBar}
              actions={
                <>
                  <Button size="sm" onClick={handleOpenTagEditor}>
                    <TagIcon />
                    タグ表示
                  </Button>
                </>
              }
            />
          )}
        </AnimatePresence>

        {/* ビューワ */}
        {isViewMode && (
          <ScrollLockProvider>
            <MediaViewer
              allNodes={mediaOnly}
              initialIndex={viewerIndex}
              onIndexChange={handleViewerIndexChange}
              onClose={closeViewer}
              onPrevFolder={(at) => openPrevFolder(at ?? "last")}
              onNextFolder={(at) => openNextFolder(at ?? "first")}
              onTags={handleToggleTagEditor}
            />
          </ScrollLockProvider>
        )}
      </FavoritesProvider>

      {/* フォルダナビゲーション */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-8 border-t border-border/30">
        {/* 前のフォルダ */}
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

        {/* 次のフォルダ */}
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
    </div>
  );
}
