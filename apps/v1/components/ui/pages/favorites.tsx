"use client";

import {
  touchMediaTimestampAction,
  updatePreviewAction,
} from "@/actions/media-actions";
import { enqueueCreateSingleThumbJobAction } from "@/actions/thumb-actions";
import { SelectionBar } from "@/components/ui/bars/selection-bar";
import { FavoriteRatingInput } from "@/components/ui/buttons/favorite-rating-input";
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
import { useFullscreen } from "@/hooks/use-fullscreen";
import { useMediaIndex } from "@/hooks/use-media-index";
import { useMediaTypeFilter } from "@/hooks/use-media-type-filter";
import { useRatingFilter } from "@/hooks/use-rating-filter";
import { useSearchParamsControl } from "@/hooks/use-search-params-control";
import { useSelectedNodes } from "@/hooks/use-selected-nodes";
import { useSort } from "@/hooks/use-sort";
import { useTagFilter } from "@/hooks/use-tag-filter";
import { useViewMode } from "@/hooks/use-view-mode";
import { useViewerControl } from "@/hooks/use-viewer-control";
import { isMedia } from "@/lib/media/media-types";
import { MediaListing, MediaNode } from "@/lib/media/types";
import {
  MenuItemDef,
  MultipleNodesContext,
  NodeContext,
} from "@/lib/menu-items/types";
import { getParentDirPath } from "@/lib/path/helpers";
import { useFavoritesContext } from "@/providers/favorites-provider";
import { useHistoryContext } from "@/providers/history-provider";
import { MenuItemsProvider } from "@/providers/menu-items-provider";
import { PagingProvider } from "@/providers/paging-provider";
import { usePathSelectionContext } from "@/providers/path-selection-provider";
import { ScrollLockProvider } from "@/providers/scroll-lock-provider";
import { useSearchFocusContext } from "@/providers/search-focus.provider";
import { useTagEditorContext } from "@/providers/tag-editor-provider";
import { useIsMobile } from "@/shadcn-overrides/hooks/use-mobile";
import { cn } from "@/shadcn/lib/utils";
import {
  ArrowDownAz,
  ExternalLinkIcon,
  FolderIcon,
  FullscreenIcon,
  ListFilterPlusIcon,
  Sparkle,
  TagIcon,
} from "lucide-react";
import { useEffect, useMemo, useTransition } from "react";
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
    pushHistory({ path: listing.path, type: "directory" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScrollRestored = () => {
    popHistory();
  };

  // ===== 並び替え =====

  // NOTE: 並び替え処理はサーバーサイドで実施
  const { value: sortValue, apply: applySortValue } = useSort();

  const sortOptions = useMemo(
    () =>
      [
        {
          value: {
            sort: "path",
            direction: "asc",
          },
          label: "パス順 (A-Z)",
          icon: ArrowDownAz,
        },
        {
          value: {
            sort: "rating",
            direction: "desc",
          },
          label: "評価順",
          icon: Sparkle,
        },
      ] as const,
    []
  );

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
  const handleAddTagFilter = (node: MediaNode) => {
    if (!node.tags || node.tags.length === 0) return;
    applyTagFilterValue({
      mode: tagFilterValue.mode,
      tags: [...tagFilterValue.tags, ...node.tags],
    });
  };

  // 検索パラメータリセット用
  const { hasSearchParams, clearSearchParams } = useSearchParamsControl();

  // ===== ビューア =====

  const {
    index: initialViewerIndex,
    isOpen: isViewerMode,
    open: openViewer,
    close: closeViewer,
  } = useViewerControl(mediaOnly);

  // ビューアスライド移動時の処理
  const handleViewerIndexChange = (index: number) => {
    const media = mediaOnly[index];
    if (!media) return;

    handleSelect(media);

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
      openViewer({ at: index });
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
      openViewer({ at: index, newTab: true });
      return;
    }

    toast.warning("このファイル形式は対応していません");
  };

  // 親フォルダを開く
  const handleOpenParentFolder = (node: MediaNode) => {
    const parentDir = getParentDirPath(node.path);
    openFolder(parentDir, { at: null });
  };

  // ===== お気に入り =====

  const { updateFavorite, getFavorite, updateMultipleFavorites } =
    useFavoritesContext();
  const [updatingFavorite, startUpdatingFavorite] = useTransition();

  // レーティング更新（単体）
  const handleChangeRatingSingle = (node: MediaNode, rating: number | null) => {
    if (updatingFavorite) return;
    startUpdatingFavorite(async () => {
      const result = await updateFavorite(node.path, rating);
      if (result.success) {
        toast.success("レーティングが更新されました。");
      } else {
        toast.error(result.error);
      }
    });
  };

  // レーティング更新（選択）
  const handleChangeRatingSelected = (rating: number | null) => {
    if (updatingFavorite) return;
    startUpdatingFavorite(async () => {
      const paths = selectedNodes.map((n) => n.path);
      const result = await updateMultipleFavorites(paths, { rating });
      if (result.success) {
        toast.success("レーティングが更新されました。");
      } else {
        toast.error(result.error);
      }
    });
  };

  // ===== 選択 =====

  const {
    isSelectionMode,
    enterSelectionMode,
    exitSelectionMode,
    selectedPaths,
    replaceSelection,
    selectPaths,
    clearSelection,
    selectedCount,
    hasSelection,
  } = usePathSelectionContext();

  const { selectedNodes } = useSelectedNodes(allNodes, selectedPaths);

  // 選択
  const handleSelect = (node: MediaNode) => {
    replaceSelection(node.path);
  };

  // 全選択
  const handleSelectAll = () => {
    selectPaths(filteredNodes.map((n) => n.path));
    enterSelectionMode();
  };

  // 選択解除
  const handleResetSelection = () => {
    clearSelection();
    exitSelectionMode();
  };

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

  // ===== サムネイル =====

  const [isUpdatingThumb, startUpdatingThumb] = useTransition();

  const updateThumb = async (node: MediaNode) => {
    // サムネイルを再作成（強制）
    await enqueueCreateSingleThumbJobAction(node.path, { force: true });

    // DBのタイムスタンプを更新（サムネイルのキャッシュを上書き）
    if (!node.isDirectory) {
      const touched = await touchMediaTimestampAction(node.path);
      if (touched.error) toast.error(touched.error);
    }

    // プレビュー設定を解除
    const updated = await updatePreviewAction(node.path, null);
    if (updated.error) toast.error(updated.error);

    // ブラウザキャッシュ更新のため、一時的にタイムスタンプを変更
    node.mtime = new Date();
  };

  // サムネイル更新（単体）
  const handleUpdateThumbSingle = (node: MediaNode) => {
    if (isUpdatingThumb) return;
    startUpdatingThumb(async () => {
      await updateThumb(node);
    });
  };

  // ===== モバイル =====

  const isMobile = useIsMobile();

  // ===== フルスクリーン =====

  const fullscreen = useFullscreen();

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

  // Escape: 選択解除
  useHotkeys("escape", () => handleResetSelection(), {
    scopes: "favorites",
  });

  // T: タグエディタ
  useHotkeys("t", () => handleToggleTagEditor(), {
    scopes: ["favorites", "viewer", "tag-editor"],
  });

  // F: 全画面表示
  useHotkeys("f", () => void fullscreen.toggleFullscreen(), {
    scopes: ["favorites", "viewer", "tag-editor"],
  });

  // Ctrl + A: 全選択
  useHotkeys(
    "ctrl+a",
    (e) => {
      e.preventDefault();
      handleSelectAll();
    },
    { scopes: ["favorites", "tag-editor"] }
  );

  // Ctrl + K: 検索
  useHotkeys(
    "ctrl+k",
    (e) => {
      e.preventDefault();
      focusSearch();
    },
    { scopes: "favorites" }
  );

  // ===== メニュー =====

  const menuItems: MenuItemDef<NodeContext>[] = [
    {
      key: "rating",
      type: "custom",
      render: ({ node }) => {
        const { rating } = getFavorite(node.path);
        return (
          <FavoriteRatingInput
            value={rating}
            onChange={(newRating) =>
              hasSelection
                ? handleChangeRatingSelected(newRating)
                : handleChangeRatingSingle(node, newRating)
            }
          />
        );
      },
    },
    {
      key: "openFolder",
      type: "action",
      icon: FolderIcon,
      label: "フォルダを開く",
      onClick: ({ node }) => handleOpenParentFolder(node),
      hidden: () => selectedCount > 1,
    },
    {
      key: "openInNewTab",
      type: "action",
      icon: ExternalLinkIcon,
      label: "新しいタブで開く",
      onClick: ({ node }) => handleOpenInNewTab(node),
      hidden: () => selectedCount > 1,
    },
    {
      key: "toggleFullscreen",
      type: "action",
      icon: FullscreenIcon,
      label: "全画面",
      onClick: fullscreen.toggleFullscreen,
      hidden: () => !isViewerMode || !fullscreen.isSupported,
    },
    {
      key: "editTags",
      type: "action",
      icon: TagIcon,
      label: "タグ編集",
      onClick: handleOpenTagEditor,
    },
    {
      key: "addTagFilter",
      type: "action",
      icon: ListFilterPlusIcon,
      label: "タグをフィルターに追加",
      onClick: ({ node }) => handleAddTagFilter(node),
      hidden: ({ node }) =>
        !node.tags || node.tags.length === 0 || selectedCount > 1,
    },
  ];

  const selectionBarInlineMenuItems: MenuItemDef<MultipleNodesContext>[] = [
    {
      key: "editTags",
      type: "action",
      icon: TagIcon,
      label: "タグ編集",
      onClick: handleOpenTagEditor,
    },
  ];

  return (
    <PagingProvider totalItems={filteredNodes.length} defaultPageSize={48}>
      <MenuItemsProvider items={menuItems}>
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
                value={sortValue}
                onChange={applySortValue}
                options={sortOptions}
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
                onClick={clearSearchParams}
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
              <PagingGridView
                allNodes={filteredNodes}
                initialScrollPath={lastHistory?.path}
                onScrollRestored={handleScrollRestored}
                onThumbError={handleUpdateThumbSingle}
                onOpen={handleOpen}
                focusOnPageChange
              />
            </div>
          )}

          {/* リストビュー */}
          {viewMode === "list" && !isViewerMode && (
            <div className="flex-1">
              <PagingListView
                allNodes={filteredNodes}
                initialScrollPath={lastHistory?.path}
                onScrollRestored={handleScrollRestored}
                onOpen={handleOpen}
                focusOnPageChange
              />
            </div>
          )}

          {/* ビューワ */}
          {isViewerMode && (
            <ScrollLockProvider>
              <MediaViewer
                allNodes={mediaOnly}
                initialIndex={initialViewerIndex}
                menuItems={menuItems}
                onIndexChange={handleViewerIndexChange}
                onClose={closeViewer}
                onOpenParent={handleOpenParentFolder}
              />
            </ScrollLockProvider>
          )}

          {/* 選択バー */}
          <SelectionBar
            open={isSelectionMode && !isTagEditMode}
            count={selectedNodes.length}
            totalCount={filteredNodes.length}
            onSelectAll={handleSelectAll}
            onClose={handleResetSelection}
            className="z-40" // DropdownMenu より小さくする
            context={{ nodes: selectedNodes }}
            inlineMenuItems={selectionBarInlineMenuItems}
          />

          {/* タグエディター */}
          <TagEditSheet
            open={isTagEditMode}
            targetNodes={selectedNodes}
            onClose={handleCloseTagEditor}
            mode={tagEditMode}
            opacity={tagEditMode === "default" ? 100 : 0}
          />
        </div>
      </MenuItemsProvider>
    </PagingProvider>
  );
}
