"use client";

import { visitFolderAction } from "@/actions/folder-actions";
import { enqueueThumbJob } from "@/actions/thumb-actions";
import { SelectionBar } from "@/components/ui/bars/selection-bar";
import { FilterResetButton } from "@/components/ui/buttons/filter-reset-button";
import { ShuffleButton } from "@/components/ui/buttons/shuffle-button";
import { TagFilterDialog } from "@/components/ui/dialogs/tag-filter-dialog";
import { RatingFilterSelect } from "@/components/ui/selects/rating-filter-select";
import { SortSelect } from "@/components/ui/selects/sort-select";
import { TagEditSheet } from "@/components/ui/sheets/tag-edit-sheet";
import { FilterResultText } from "@/components/ui/texts/filter-result-text";
import { MediaViewer } from "@/components/ui/viewers/media-viewer";
import { PagingGridView } from "@/components/ui/views/paging-grid-view";
import { PagingListView } from "@/components/ui/views/paging-list-view";
import { useExplorerQuery } from "@/hooks/use-explorer-query";
import { useTagFilter } from "@/hooks/use-tag-filter";
import {
  createRatingFilter,
  createSearchFilter,
  createTagFilter,
} from "@/lib/media/filters";
import { isMedia } from "@/lib/media/media-types";
import {
  MediaNode,
  MediaNodeFilter,
  MediaPathToIndexMap,
  MediaPathToNodeMap,
} from "@/lib/media/types";
import { normalizeIndex } from "@/lib/query/utils";
import { useExplorerContext } from "@/providers/explorer-provider";
import { useFavoritesContext } from "@/providers/favorites-provider";
import { PagingProvider } from "@/providers/paging-provider";
import { usePathSelectionContext } from "@/providers/path-selection-provider";
import { ScrollLockProvider } from "@/providers/scroll-lock-provider";
import { useSearchContext } from "@/providers/search-provider";
import { useTagEditorContext } from "@/providers/tag-editor-provider";
import { useViewModeContext } from "@/providers/view-mode-provider";
import { Button } from "@/shadcn/components/ui/button";
import { cn } from "@/shadcn/lib/utils";
import { AnimatePresence } from "framer-motion";
import { ArrowDown10, ArrowDownAz, ArrowDownZa, TagIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useHotkeys, useHotkeysContext } from "react-hotkeys-hook";
import { toast } from "sonner";

export function Favorites() {
  const { listing, openViewer, closeViewer, openFolder } = useExplorerContext();

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
      setExplorerQuery({
        q: query.trim() === "" ? undefined : query,
        view: viewMode === "grid" ? undefined : viewMode,
      });
    }
  }, [setExplorerQuery, query, viewMode, q, view]);

  // ===== フィルタリング =====

  // タグフィルタ
  const tagFilter = useTagFilter();

  // 最小レーティングフィルタ
  const [minRating, setMinRating] = useState<number>(0);

  // フィルタリセット
  const handleResetFilters = () => {
    tagFilter.selectTags([]);
    tagFilter.setMode("AND");
    setMinRating(0);
  };

  // フィルターが一つでも適用されているかチェック
  const isFiltered =
    tagFilter.selectedCount > 0 || tagFilter.mode !== "AND" || minRating > 0;

  // フィルタ関数
  const searchFilterFn = useMemo(() => createSearchFilter(query), [query]);
  const tagFilterFn = useMemo(
    () =>
      createTagFilter(
        tagFilter.selectedTags.map((t) => t.name),
        tagFilter.mode
      ),
    [tagFilter]
  );
  const ratingFilterFn = useMemo(
    () => createRatingFilter(minRating),
    [minRating]
  );

  const allNodes = listing.nodes;

  // フィルタリング結果
  const filteredNodes = useMemo(() => {
    // 各フィルタの生成
    const filters: MediaNodeFilter[] = [
      searchFilterFn,
      tagFilterFn,
      ratingFilterFn,
    ];

    // フィルタの適用
    return allNodes.filter((node) => {
      if (node.isDirectory) {
        // フォルダは検索クエリには反応させるが、タグやお気に入りフィルタからは除外する
        return searchFilterFn(node);
      }

      // メディアファイルは全てのフィルタを適用
      return filters.every((fn) => fn(node));
    });
  }, [allNodes, searchFilterFn, tagFilterFn, ratingFilterFn]);

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

  const favCtx = useFavoritesContext();

  const handleFavoriteChange = (node: MediaNode, rating: number | null) => {
    try {
      void favCtx.updateFavorite(node.path, rating);
    } catch {
      toast.error("お気に入りの更新に失敗しました");
    }
  };

  // ===== 選択機能 =====

  const {
    isSelectionMode,
    enterSelectionMode,
    exitSelectionMode,
    selectedPaths,
    replaceSelection,
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

  // 選択
  const handleSelectSingle = (node: MediaNode) => {
    replaceSelection(node.path);
  };

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

  // ===== ショートカット =====

  const { enableScope, disableScope } = useHotkeysContext();

  const allScopes = useMemo(
    () => ["favorites-main", "tag-editor", "viewer", "dialog"] as const,
    []
  );

  const activeScope = useMemo<(typeof allScopes)[number]>(() => {
    if (isTagEditMode) return "tag-editor";
    else if (isViewMode) return "viewer";
    else return "favorites-main";
  }, [isTagEditMode, isViewMode]);

  // デバッグ用
  useEffect(() => console.log({ activeScope }), [activeScope]);

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
  // T: タグエディタ
  // Ctrl + A: 全選択
  // Ctrl + K: 検索
  useHotkeys("escape", () => handleClearSelection(), {
    scopes: "favorites-main",
  });
  useHotkeys("t", () => handleToggleTagEditor(), {
    scopes: ["favorites-main", "viewer", "tag-editor"],
  });
  useHotkeys(
    "ctrl+a",
    (e) => {
      e.preventDefault();
      handleSelectAll();
    },
    { scopes: ["favorites-main", "tag-editor"] }
  );
  useHotkeys(
    "ctrl+k",
    (e) => {
      e.preventDefault();
      focusSearch();
    },
    { scopes: "favorites-main" }
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-2">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-2 flex-grow">
            {/* 並び替え */}
            <SortSelect
              options={[
                {
                  key: "path",
                  direction: "asc",
                  label: "パス順 (A-Z)",
                  icon: ArrowDownAz,
                },
                {
                  key: "path",
                  direction: "desc",
                  label: "パス順 (Z-A)",
                  icon: ArrowDownZa,
                },
                {
                  key: "rating",
                  direction: "desc",
                  label: "評価が高い順",
                  icon: ArrowDown10,
                },
              ]}
            />

            {/* シャッフルボタン */}
            <ShuffleButton />

            {/* 評価フィルター */}
            <RatingFilterSelect value={minRating} onChange={setMinRating} />

            {/* タグフィルター */}
            <TagFilterDialog />

            {/* リセットボタン */}
            <FilterResetButton
              onReset={handleResetFilters}
              isVisible={isFiltered}
            />

            {/* フィルター結果 */}
            <FilterResultText
              totalCount={allNodes.length}
              filteredCount={filteredNodes.length}
              isFiltered={isFiltered}
              className="ml-auto"
            />
          </div>
        </div>

        {/* グリッドビュー */}
        {viewMode === "grid" && !isViewMode && (
          <div className="flex-1">
            <PagingGridView
              allNodes={filteredNodes}
              initialScrollPath={lastPath}
              onOpen={handleOpen}
              onOpenFolder={openFolder}
              onRatingChange={handleFavoriteChange}
              onEditTags={(node) => {
                handleSelectSingle(node);
                handleOpenTagEditor();
              }}
              onScrollRestored={() => setLastPath(null)}
            />
          </div>
        )}

        {/* リストビュー */}
        {viewMode === "list" && !isViewMode && (
          <div className="flex-1">
            <PagingListView
              allNodes={filteredNodes}
              initialScrollPath={lastPath}
              onOpen={handleOpen}
              onOpenFolder={openFolder}
              onRatingChange={handleFavoriteChange}
              onEditTags={(node) => {
                handleSelectSingle(node);
                handleOpenTagEditor();
              }}
              onScrollRestored={() => setLastPath(null)}
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
              onOpenFolder={openFolder}
              onEditTags={handleToggleTagEditor}
            />
          </ScrollLockProvider>
        )}

        {/* 選択バー */}
        <AnimatePresence>
          {isSelectionMode && !isTagEditMode && (
            <SelectionBar
              count={selected.length}
              totalCount={filteredNodes.length}
              onSelectAll={handleSelectAll}
              onClose={handleCloseSelectionBar}
              className="z-40" // DropdownMenu より小さくする
              actions={
                <div className="flex gap-1 items-center">
                  {/* メインのアクション */}
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleOpenTagEditor}
                    disabled={selected.length === 0}
                  >
                    <TagIcon size={18} />
                  </Button>
                </div>
              }
            />
          )}
        </AnimatePresence>

        {/* タグエディター */}
        <AnimatePresence>
          {isTagEditMode && (
            <TagEditSheet
              targetNodes={selected}
              onClose={handleCloseTagEditor}
              mode={tagEditMode}
              opacity={tagEditMode === "default" ? 100 : 0}
            />
          )}
        </AnimatePresence>
      </div>
    </PagingProvider>
  );
}
