"use client";

import { SelectionBar } from "@/components/ui/bars/selection-bar";
import { ResetButton } from "@/components/ui/buttons/reset-button";
import { ShuffleButton } from "@/components/ui/buttons/shuffle-button";
import { RatingFilterDialog } from "@/components/ui/dialogs/rating-filter-dialog";
import { TagFilterDialog } from "@/components/ui/dialogs/tag-filter-dialog";
import { MediaTypeFilterSelect } from "@/components/ui/selects/media-type-filter-select";
import { SortSelect } from "@/components/ui/selects/sort-select";
import { TagEditSheet } from "@/components/ui/sheets/tag-edit-sheet";
import { FilterResultText } from "@/components/ui/texts/filter-result-text";
import { MediaViewer } from "@/components/ui/viewers/media-viewer";
import { PagingGridView } from "@/components/ui/views/paging-grid-view";
import { PagingListView } from "@/components/ui/views/paging-list-view";
import { useExplorerQuery } from "@/hooks/use-explorer-query";
import { useFilteredNodes } from "@/hooks/use-filtered-nodes";
import { useMediaTypeFilter } from "@/hooks/use-media-type-filter";
import { useRatingFilter } from "@/hooks/use-rating-filter";
import { useSearchParamsControl } from "@/hooks/use-search-params-control";
import { useSelectionControl } from "@/hooks/use-selection-control";
import { useViewerControl } from "@/hooks/use-viewer-control";
import { isMedia } from "@/lib/media/media-types";
import { MediaNode } from "@/lib/media/types";
import { getParentDirPath } from "@/lib/path/helpers";
import { ActionsProvider } from "@/providers/actions-provider";
import { useExplorerContext } from "@/providers/explorer-provider";
import { useFavoritesContext } from "@/providers/favorites-provider";
import { useHistoryContext } from "@/providers/history-provider";
import { PagingProvider } from "@/providers/paging-provider";
import { ScrollLockProvider } from "@/providers/scroll-lock-provider";
import { useSearchContext } from "@/providers/search-provider";
import { useTagEditorContext } from "@/providers/tag-editor-provider";
import { useTagFilterContext } from "@/providers/tag-filter-provider";
import { useViewModeContext } from "@/providers/view-mode-provider";
import { useIsMobile } from "@/shadcn-overrides/hooks/use-mobile";
import { Button } from "@/shadcn/components/ui/button";
import { cn } from "@/shadcn/lib/utils";
import { ArrowDownAz, Sparkle, TagIcon } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
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

  // ===== 訪問履歴 =====

  const {
    last: lastHistory,
    pushHistory,
    toHistoryItem,
    popHistory,
    replaceHistoryLast,
  } = useHistoryContext();

  useEffect(() => {
    pushHistory({ path: listing.path, type: "folder" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScrollRestored = () => {
    popHistory();
  };

  // ===== フィルタリング =====

  const allNodes = listing.nodes;

  // 種別フィルター
  const { value: mediaTypeFilterValue, apply: applyMediaTypeFilterValue } =
    useMediaTypeFilter(); // TODO: Context

  // 評価フィルター
  const { value: ratingFilterValue, apply: applyRatingFilterValue } =
    useRatingFilter(); // TODO: Context

  // タグフィルター
  const { value: tagFilterValue, apply: applyTagFilterValue } =
    useTagFilterContext();

  // フィルター結果
  const { filtered: filteredNodes, mediaOnly } = useFilteredNodes({
    allNodes,
    query,
    mediaTypeFilterValue,
    ratingFilterValue,
    tagFilterValue,
  });

  // タグをフィルターに追加
  const addTagFilter = (node: MediaNode) => {
    if (!node.tags || node.tags.length === 0) return;
    applyTagFilterValue({
      mode: tagFilterValue.mode,
      tags: [...tagFilterValue.tags, ...node.tags],
    });
  };

  // 検索パラメータリセット用
  const { hasSearchParams, resetSearchParams } = useSearchParamsControl();

  // ===== ビューア =====

  const { initialIndex, getViewerIndex, isViewMode } = useViewerControl({
    mediaOnly,
    at,
    modal,
  });

  // ビューアスライド移動時の処理
  const handleViewerIndexChange = (index: number) => {
    const media = mediaOnly[index];
    if (!media) return;

    select(media);

    if (lastHistory?.type === "file") {
      replaceHistoryLast(toHistoryItem(media));
    } else {
      pushHistory(toHistoryItem(media));
    }
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

  const handleOpenParentFolder = (node: MediaNode) => {
    const parentDir = getParentDirPath(node.path);
    openFolder(parentDir);
  };

  // ===== お気に入り =====

  const favCtx = useFavoritesContext();

  // レーティング更新
  const handleRatingChange = async (node: MediaNode, rating: number | null) => {
    try {
      await favCtx.updateFavorite(node.path, rating);
    } catch {
      toast.error("お気に入りの更新に失敗しました");
    }
  };

  // ===== 選択機能 =====

  const { isSelectionMode, selected, select, selectAll, resetSelection } =
    useSelectionControl({
      allNodes,
      controlledNodes: filteredNodes,
    });

  // ===== タグエディタ =====

  const { isTagEditMode, setIsTagEditMode } = useTagEditorContext();

  // タグエディタの起動モード
  const tagEditMode = useMemo(() => {
    if (isViewMode) return "single";
    return "default";
  }, [isViewMode]);

  // タグエディタを表示
  const handleOpenTagEditor = () => {
    setIsTagEditMode(true);
  };

  // タグエディタを非表示
  const handleCloseTagEditor = () => {
    setIsTagEditMode(false);
  };

  // タグエディタを表示/非表示
  const handleToggleTagEditor = () => {
    setIsTagEditMode((prev) => !prev);
  };

  // ===== ショートカット =====

  // スコープ切り替えフック
  const { enableScope, disableScope } = useHotkeysContext();

  // ショートカット利用可能スコープ
  const allScopes = useMemo(
    () => ["favorites", "tag-editor", "viewer", "dialog"] as const,
    []
  );

  // 現在のスコープ
  const activeScope = useMemo<(typeof allScopes)[number]>(() => {
    if (isTagEditMode) return "tag-editor";
    else if (isViewMode) return "viewer";
    else return "favorites";
  }, [isTagEditMode, isViewMode]);

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
  // T: タグエディタ
  // Ctrl + A: 全選択
  // Ctrl + K: 検索
  useHotkeys("escape", () => resetSelection(), {
    scopes: "favorites",
  });
  useHotkeys("t", () => handleToggleTagEditor(), {
    scopes: ["favorites", "viewer", "tag-editor"],
  });
  useHotkeys(
    "ctrl+a",
    (e) => {
      e.preventDefault();
      selectAll();
    },
    { scopes: ["favorites", "tag-editor"] }
  );
  useHotkeys(
    "ctrl+k",
    (e) => {
      e.preventDefault();
      focusSearch();
    },
    { scopes: "favorites" }
  );

  // ===== その他 =====

  // スクロール対象のref
  const scrollRef = useRef<HTMLDivElement>(null);

  // モバイル判定
  const isMobile = useIsMobile();

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
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-[repeat(6,180px)] gap-2 flex-grow">
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
                  key: "rating",
                  direction: "desc",
                  label: "評価順",
                  icon: Sparkle,
                },
              ]}
            />

            {/* 種別フィルター */}
            <MediaTypeFilterSelect
              value={mediaTypeFilterValue}
              onChange={applyMediaTypeFilterValue}
              displayTypes={["all", "image", "video", "audio"]}
            />

            {/* 評価フィルター */}
            <RatingFilterDialog
              value={ratingFilterValue}
              onChange={applyRatingFilterValue}
            />

            {/* タグフィルター */}
            <TagFilterDialog
              value={tagFilterValue}
              onChange={applyTagFilterValue}
              relatedNodes={mediaOnly}
              autoFocusInput={!isMobile}
            />

            {/* シャッフルボタン */}
            <ShuffleButton />

            {/* リセットボタン */}
            <ResetButton
              onReset={resetSearchParams}
              isVisible={hasSearchParams}
            />
          </div>

          {/* 件数 */}
          <FilterResultText
            totalCount={allNodes.length}
            filteredCount={filteredNodes.length}
            isFiltered={allNodes.length !== filteredNodes.length}
            className="ml-auto min-w-[120px] text-right"
          />
        </div>

        {/* グリッドビュー */}
        {viewMode === "grid" && !isViewMode && (
          <div className="flex-1">
            <ActionsProvider
              actions={{
                open: handleOpen,
                openParentFolder: handleOpenParentFolder,
                changeRating: handleRatingChange,
                editTags: (node: MediaNode) => {
                  select(node);
                  handleOpenTagEditor();
                },
                addTagFilter,
              }}
            >
              <PagingGridView
                allNodes={filteredNodes}
                initialScrollPath={lastHistory?.path}
                onScrollRestored={handleScrollRestored}
              />
            </ActionsProvider>
          </div>
        )}

        {/* リストビュー */}
        {viewMode === "list" && !isViewMode && (
          <div className="flex-1">
            <ActionsProvider
              actions={{
                open: handleOpen,
                openParentFolder: handleOpenParentFolder,
                changeRating: handleRatingChange,
                editTags: (node: MediaNode) => {
                  select(node);
                  handleOpenTagEditor();
                },
                addTagFilter,
              }}
            >
              <PagingListView
                allNodes={filteredNodes}
                initialScrollPath={lastHistory?.path}
                onScrollRestored={handleScrollRestored}
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
              onOpenFolder={openFolder}
              onEditTags={handleToggleTagEditor}
            />
          </ScrollLockProvider>
        )}

        {/* 選択バー */}
        <SelectionBar
          open={isSelectionMode && !isTagEditMode}
          count={selected.length}
          totalCount={filteredNodes.length}
          onSelectAll={selectAll}
          onClose={resetSelection}
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

        {/* タグエディター */}
        <TagEditSheet
          open={isTagEditMode}
          targetNodes={selected}
          onClose={handleCloseTagEditor}
          mode={tagEditMode}
          opacity={tagEditMode === "default" ? 100 : 0}
        />
      </div>
    </PagingProvider>
  );
}
