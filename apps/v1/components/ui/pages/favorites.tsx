"use client";

import { SelectionBar } from "@/components/ui/bars/selection-bar";
import { ResetButton } from "@/components/ui/buttons/reset-button";
import { ShuffleButton } from "@/components/ui/buttons/shuffle-button";
import { RatingFilterDialog } from "@/components/ui/dialogs/rating-filter-dialog";
import { TagFilterDialog } from "@/components/ui/dialogs/tag-filter-dialog";
import { MediaTypeFilterMultiSelect } from "@/components/ui/selects/media-type-filter-multi-select";
import { SortSelect } from "@/components/ui/selects/sort-select";
import { TagEditSheet } from "@/components/ui/sheets/tag-edit-sheet";
import { FilterResultText } from "@/components/ui/texts/filter-result-text";
import { MediaViewer } from "@/components/ui/viewers/media-viewer";
import { PagingGridView } from "@/components/ui/views/paging-grid-view";
import { PagingListView } from "@/components/ui/views/paging-list-view";
import { useFolderNavigation } from "@/hooks/use-folder-navigation";
import { useMediaIndex } from "@/hooks/use-media-index";
import { useMediaTypeFilter } from "@/hooks/use-media-type-filter";
import { useRatingFilter } from "@/hooks/use-rating-filter";
import { useSearchParamsControl } from "@/hooks/use-search-params-control";
import { useSelectionControl } from "@/hooks/use-selection-control";
import { useTagFilter } from "@/hooks/use-tag-filter";
import { useViewMode } from "@/hooks/use-view-mode";
import { useViewerControl } from "@/hooks/use-viewer-control";
import { isMedia } from "@/lib/media/media-types";
import { MediaListing, MediaNode } from "@/lib/media/types";
import { getParentDirPath } from "@/lib/path/helpers";
import { ActionsProvider } from "@/providers/actions-provider";
import { useFavoritesContext } from "@/providers/favorites-provider";
import { useHistoryContext } from "@/providers/history-provider";
import { PagingProvider } from "@/providers/paging-provider";
import { ScrollLockProvider } from "@/providers/scroll-lock-provider";
import { useSearchFocusContext } from "@/providers/search-focus.provider";
import { useTagEditorContext } from "@/providers/tag-editor-provider";
import { useIsMobile } from "@/shadcn-overrides/hooks/use-mobile";
import { Button } from "@/shadcn/components/ui/button";
import { cn } from "@/shadcn/lib/utils";
import { ArrowDownAz, Sparkle, TagIcon } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useHotkeys, useHotkeysContext } from "react-hotkeys-hook";
import { toast } from "sonner";

export function Favorites({ listing }: { listing: MediaListing }) {
  // ===== 検索 =====

  const { trigger: focusSearch } = useSearchFocusContext();

  // ===== ビューモード =====

  const { value: viewMode } = useViewMode();

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
    useMediaTypeFilter();

  // 評価フィルター
  const { value: ratingFilterValue, apply: applyRatingFilterValue } =
    useRatingFilter();

  // タグフィルター
  const { value: tagFilterValue, apply: applyTagFilterValue } = useTagFilter();

  // フィルター結果
  const filteredNodes = allNodes; // サーバーサイドでフィルター済み
  const mediaOnly = filteredNodes; // サーバーサイドでフィルター済み
  const filteredCount = filteredNodes.length;
  const totalCount = listing.total ?? allNodes.length;
  const isFiltered = totalCount !== filteredCount;

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

  const {
    normalizedIndex: initialViewerIndex,
    isOpen: isViewerMode,
    open: openViewer,
    close: closeViewer,
  } = useViewerControl(mediaOnly);

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

  const { navigate: openFolder } = useFolderNavigation();
  const { getMediaIndex } = useMediaIndex(mediaOnly);

  // ファイル/フォルダオープン
  const handleOpen = (node: MediaNode) => {
    if (node.isDirectory) {
      openFolder(node.path);
      return;
    }

    if (isMedia(node.type)) {
      const index = getMediaIndex(node.path);
      if (index == null) return;
      openViewer(index);
      return;
    }

    toast.warning("このファイル形式は対応していません");
  };

  // 新しいタブで開く
  const handleOpenInNewTab = (node: MediaNode) => {
    if (node.isDirectory) {
      openFolder(node.path, { newTab: true });
      return;
    }

    if (isMedia(node.type)) {
      const index = getMediaIndex(node.path);
      if (index == null) return;
      openViewer(index, { newTab: true });
      return;
    }

    toast.warning("このファイル形式は対応していません");
  };

  // 親フォルダを開く
  const handleOpenParentFolder = (node: MediaNode) => {
    const parentDir = getParentDirPath(node.path);
    openFolder(parentDir);
  };

  // ===== お気に入り =====

  const favCtx = useFavoritesContext();

  // お気に入り登録/解除
  const handleToggleFavorite = (node: MediaNode) => {
    try {
      favCtx.toggleFavorite(node.path);
    } catch {
      toast.error("お気に入りの更新に失敗しました");
    }
  };

  // レーティング更新
  const handleRatingChange = (node: MediaNode, rating: number | null) => {
    try {
      favCtx.updateFavorite(node.path, rating);
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
    if (isViewerMode) return "single";
    return "default";
  }, [isViewerMode]);

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
    else if (isViewerMode) return "viewer";
    else return "favorites";
  }, [isTagEditMode, isViewerMode]);

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
        tabIndex={-1}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-2">
          {/* 操作メニュー */}
          <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-2 flex-grow">
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
            <MediaTypeFilterMultiSelect
              value={mediaTypeFilterValue}
              onChange={applyMediaTypeFilterValue}
              displayTypes={["image", "video", "audio"]}
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
            totalCount={totalCount}
            filteredCount={filteredCount}
            isFiltered={isFiltered}
            className="ml-auto min-w-[120px] text-right"
          />
        </div>

        {/* グリッドビュー */}
        {viewMode === "grid" && !isViewerMode && (
          <div className="flex-1">
            <ActionsProvider
              actions={{
                open: handleOpen,
                openInNewTab: handleOpenInNewTab,
                openParentFolder: handleOpenParentFolder,
                toggleFavorite: handleToggleFavorite,
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
        {viewMode === "list" && !isViewerMode && (
          <div className="flex-1">
            <ActionsProvider
              actions={{
                open: handleOpen,
                openInNewTab: handleOpenInNewTab,
                openParentFolder: handleOpenParentFolder,
                changeRating: handleRatingChange,
                toggleFavorite: handleToggleFavorite,
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
        {isViewerMode && (
          <ScrollLockProvider>
            <MediaViewer
              allNodes={mediaOnly}
              initialIndex={initialViewerIndex}
              onIndexChange={handleViewerIndexChange}
              onClose={closeViewer}
              onOpenFolder={(path, at) => openFolder(path, { at })}
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
