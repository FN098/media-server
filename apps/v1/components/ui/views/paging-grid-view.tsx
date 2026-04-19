"use client";

import { FavoriteCountBadge } from "@/components/ui/badges/favorite-count-badge";
import { FolderStatusBadge } from "@/components/ui/badges/folder-status-badge";
import { ToggleFavoriteButton } from "@/components/ui/buttons/toggle-favorite-button";
import { ActionContextMenu } from "@/components/ui/context-menus/action-context-menu";
import { ActionDropdownMenu } from "@/components/ui/dropdown-menus/action-dropdown-menu";
import { PagingControl } from "@/components/ui/paginations/pagination-control";
import { HoverPreviewPortal } from "@/components/ui/portals/hover-preview-portal";
import { MarqueeText } from "@/components/ui/texts/marquee-text";
import { MediaThumb } from "@/components/ui/thumbnails/media-thumb";
import { useLongPress } from "@/hooks/use-long-press";
import { isMedia } from "@/lib/media/media-types";
import { MediaNode } from "@/lib/media/types";
import { useActionsContext } from "@/providers/actions-provider";
import { useFavoritesContext } from "@/providers/favorites-provider";
import { usePagingContext } from "@/providers/paging-provider";
import { usePathSelectionContext } from "@/providers/path-selection-provider";
import { useIsMobile } from "@/shadcn-overrides/hooks/use-mobile";
import { Checkbox } from "@/shadcn/components/ui/checkbox";
import { cn } from "@/shadcn/lib/utils";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

interface PagingGridViewProps {
  allNodes: MediaNode[];
  initialScrollPath?: string | null;
  onPageChange?: (page: number) => void;
  onScrollRestored?: () => void;
  focusOnPageChange?: boolean;
}

export function PagingGridView({
  allNodes,
  initialScrollPath,
  onPageChange,
  onScrollRestored,
  focusOnPageChange = false,
}: PagingGridViewProps) {
  const {
    page: currentPage,
    pageSize,
    totalPages,
    setPage,
    paginate,
  } = usePagingContext();

  const selectCtx = usePathSelectionContext();
  const { actions } = useActionsContext();
  const isMobile = useIsMobile();

  // 現在のページのノード
  const currentNodes = useMemo(() => paginate(allNodes), [allNodes, paginate]);

  // ビューコンテナ
  const containerRef = useRef<HTMLDivElement>(null);

  // グリッドの列数
  const [columnCount, setColumnCount] = useState(0);

  // スクロール復元が実行済みかどうかを保持するフラグ
  const hasRestored = useRef(false);

  // パスから初期スクロール対象インデックスを特定する
  const initialScrollTargetIndex = useMemo(() => {
    if (!initialScrollPath) return null;
    const index = allNodes.findIndex((n) => n.path === initialScrollPath);
    return index !== -1 ? index : null;
  }, [allNodes, initialScrollPath]);

  // 初期スクロール対象ページを特定する
  const initialScrollTargetPage = useMemo(() => {
    if (!initialScrollTargetIndex) return null;
    return Math.floor(initialScrollTargetIndex / pageSize) + 1;
  }, [pageSize, initialScrollTargetIndex]);

  // 初期スクロール対象ページに遷移
  useEffect(() => {
    if (
      !initialScrollTargetPage ||
      initialScrollTargetPage === currentPage ||
      hasRestored.current
    ) {
      return;
    }
    setPage(initialScrollTargetPage);
  }, [currentPage, setPage, initialScrollTargetPage]);

  // 初期スクロール実行と完了通知
  useEffect(() => {
    // すでに復元済み、またはターゲットがない場合は何もしない
    if (hasRestored.current || initialScrollTargetIndex === null) return;

    const pageStart = (currentPage - 1) * pageSize;
    const pageEnd = pageStart + pageSize;

    // 現在のページにターゲットが含まれているか確認
    if (
      initialScrollTargetIndex >= pageStart &&
      initialScrollTargetIndex < pageEnd
    ) {
      const element = document.getElementById(
        `media-item-${initialScrollTargetIndex}`
      );
      if (element) {
        element.scrollIntoView({ behavior: "instant", block: "center" });

        // フラグを立てて、二度と実行されないようにする
        hasRestored.current = true;
        onScrollRestored?.();
      }
    }
  }, [currentPage, pageSize, initialScrollTargetIndex, onScrollRestored]);

  // 範囲外アクセスでページリセット
  useEffect(() => {
    // currentPage は 1 以上であることが保証されているため、上限のみチェック
    if (currentPage > 1 && allNodes.length > 0) {
      const maxPage = Math.ceil(allNodes.length / pageSize);
      if (currentPage > maxPage) {
        setPage(1);
      }
    }
  }, [allNodes.length, pageSize, currentPage, setPage]);

  // ページ更新ハンドラ
  const handlePageChange = (page: number) => {
    setPage(page);
    onPageChange?.(page);
  };

  // 列数の動的計算
  useEffect(() => {
    const updateColumns = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        // CSSの minmax(120px or 180px) と gap(16px) に合わせる
        const minWidth = isMobile ? 120 : 180;
        const gap = 16;
        // 列数 = (コンテナ幅 + gap) / (最小幅 + gap) の切り捨て
        const cols = Math.floor((containerWidth + gap) / (minWidth + gap));
        setColumnCount(cols || 1);
      }
    };

    const observer = new ResizeObserver(updateColumns);
    if (containerRef.current) observer.observe(containerRef.current);
    updateColumns();
    return () => observer.disconnect();
  }, [isMobile]);

  // キーボード操作ハンドラ
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const moveKeys = [
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "Enter",
      ];
      if (!moveKeys.includes(e.key)) return;

      e.preventDefault();

      // 最後に選択されたパスから現在のインデックスを探す
      const currentPath = selectCtx.lastSelectedPath;
      const currentIndex = allNodes.findIndex((n) => n.path === currentPath);

      // Enterで開く
      if (e.key === "Enter" && currentPath) {
        const node = allNodes[currentIndex];
        if (node) void actions.open?.(node);
        return;
      }

      // 何も選択されていない場合は最初の要素を選択
      if (currentIndex === -1) {
        const first = allNodes[0];
        if (first) {
          selectCtx.replaceSelection(first.path);
          selectCtx.setLastSelectedPath(first.path);
          selectCtx.setAnchorPath(first.path);
        }
        return;
      }

      // 次のインデックス計算
      let nextIndex = currentIndex;
      if (e.key === "ArrowLeft") nextIndex -= 1;
      if (e.key === "ArrowRight") nextIndex += 1;
      if (e.key === "ArrowUp") nextIndex -= columnCount;
      if (e.key === "ArrowDown") nextIndex += columnCount;

      // 範囲チェック
      if (nextIndex < 0 || nextIndex >= allNodes.length) return;

      const nextNode = allNodes[nextIndex];

      if (e.shiftKey) {
        // --- 範囲選択移動 (Shift) ---
        // 起点 (anchorPath) がなければ現在の位置を起点にする
        const anchorPath = selectCtx.anchorPath ?? currentPath;
        const anchorIndex = allNodes.findIndex((n) => n.path === anchorPath);

        const start = Math.min(anchorIndex, nextIndex);
        const end = Math.max(anchorIndex, nextIndex);
        const paths = allNodes.slice(start, end + 1).map((n) => n.path);

        selectCtx.enterSelectionMode();
        selectCtx.selectPaths(paths); // 範囲で上書き
        // ※ setAnchorPath は更新しない (起点を維持)
      } else {
        // 通常移動
        selectCtx.replaceSelection(nextNode.path);
        selectCtx.setAnchorPath(nextNode.path); // 次のShift操作のために起点を更新
      }

      // フォーカス位置更新
      selectCtx.setLastSelectedPath(nextNode.path);

      // ページ更新（必要なら）
      const nextPage = Math.floor(nextIndex / pageSize) + 1;
      if (nextPage !== currentPage) {
        // ページが変わる場合：今のDOMには nextIndex がないので、
        // ページ遷移後の useEffect でスクロールさせるためにフラグを立てる
        setPage(nextPage);
      }

      // DOMが更新されるタイミングでスクロール
      requestAnimationFrame(() => {
        const el = document.getElementById(`media-item-${nextIndex}`);
        el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    },
    [selectCtx, allNodes, columnCount, pageSize, currentPage, actions, setPage]
  );

  // ページ遷移時の自動スクロール（副作用）
  useEffect(() => {
    if (focusOnPageChange) {
      containerRef.current?.focus();
    }

    // ページ変更に伴うスクロールが必要な場合、または外部からの指示（初期表示など）
    // lastSelectedPath があれば、その要素へスクロールを試みる
    const currentPath = selectCtx.lastSelectedPath;
    if (!currentPath) return;

    const currentIndex = allNodes.findIndex((n) => n.path === currentPath);
    if (currentIndex === -1) return;

    // ページ変更によるスクロール、またはページボタンクリックなどによる遷移の場合に実行
    requestAnimationFrame(() => {
      const el = document.getElementById(`media-item-${currentIndex}`);
      el?.scrollIntoView({ behavior: "instant", block: "nearest" });
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]); // 依存は currentPage だけでOK

  return (
    <div
      ref={containerRef}
      className="h-full flex flex-col relative outline-none"
      tabIndex={0} // フォーカス可能にし、keydownイベントを拾う
      onKeyDown={handleKeyDown}
    >
      <div
        className={cn(
          "flex-1 overflow-y-auto p-4 grid gap-4 auto-rows-max",
          isMobile
            ? "grid-cols-[repeat(auto-fill,minmax(120px,1fr))]"
            : "grid-cols-[repeat(auto-fill,minmax(180px,1fr))]"
        )}
      >
        {currentNodes.map((node, index) => (
          <Cell
            key={node.path}
            node={node}
            globalIndex={(currentPage - 1) * pageSize + index}
            allNodes={allNodes}
            isMobile={isMobile}
          />
        ))}
      </div>

      <PagingControl
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        className="shrink-0"
      />
    </div>
  );
}

interface CellProps {
  node: MediaNode;
  globalIndex: number;
  allNodes: MediaNode[];
  isMobile: boolean;
  onSelectionChange?: () => void;
}

function Cell({
  node,
  globalIndex,
  allNodes,
  isMobile,
  onSelectionChange,
}: CellProps) {
  const isMediaNode = useMemo(() => isMedia(node.type), [node.type]);

  const favCtx = useFavoritesContext();
  const { isFavorite, rating } = favCtx.getFavorite(node.path);

  const selectCtx = usePathSelectionContext();
  const isSelected = selectCtx.isSelectedPath(node.path);

  const [actionDropdownMenuOpen, setActionDropdownMenuOpen] = useState(false);
  const [actionContextMenuOpen, setActionContextMenuOpen] = useState(false);
  const {
    actions: { open, toggleFavorite },
  } = useActionsContext();

  const { actions } = useActionsContext();

  const handleLongPress = useCallback(() => {
    selectCtx.enterSelectionMode();
    selectCtx.replaceSelection(node.path);
    selectCtx.setLastSelectedPath(node.path);
    onSelectionChange?.();
  }, [selectCtx, node.path, onSelectionChange]);

  const { start, stop, isLongPressed } = useLongPress({
    callback: handleLongPress,
    ms: 600,
  });

  const handleClick = (e: React.MouseEvent) => {
    if (isLongPressed || isMobile) return;
    e.preventDefault();

    if (e.shiftKey && selectCtx.anchorPath !== null) {
      // Shift 選択
      selectCtx.enterSelectionMode();
      const anchorIdx = allNodes.findIndex(
        (n) => n.path === selectCtx.anchorPath
      );
      if (anchorIdx === -1) return;
      const startIdx = Math.min(anchorIdx, globalIndex);
      const endIdx = Math.max(anchorIdx, globalIndex);
      const paths = allNodes.slice(startIdx, endIdx + 1).map((n) => n.path);

      if (e.ctrlKey || e.metaKey) {
        // Ctrl あり
        selectCtx.deletePaths(paths);
      } else {
        // Shift のみ
        selectCtx.addPaths(paths);
      }
    } else if (e.ctrlKey || e.metaKey) {
      // Ctrl選択
      selectCtx.enterSelectionMode();
      selectCtx.togglePath(node.path);
      selectCtx.setAnchorPath(node.path); // 次のShift操作の起点更新
    } else {
      // 通常選択
      selectCtx.exitSelectionMode();
      selectCtx.replaceSelection(node.path);
      selectCtx.setAnchorPath(node.path); // 次のShift操作の起点更新
    }

    selectCtx.setLastSelectedPath(node.path);
    onSelectionChange?.();
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (isMobile || e.ctrlKey || e.metaKey || e.shiftKey) return;
    e.preventDefault();
    void open?.(node);
  };

  const handleTap = (e: React.MouseEvent) => {
    if (isLongPressed || !isMobile) return;
    e.preventDefault();

    if (selectCtx.isSelectionMode) {
      if (!isSelected) {
        selectCtx.selectPath(node.path);
      } else {
        selectCtx.unselectPath(node.path);
        if (
          selectCtx.selectedPaths.size === 1 &&
          selectCtx.selectedPaths.has(node.path)
        ) {
          selectCtx.exitSelectionMode();
        }
      }
      onSelectionChange?.();
      return;
    }

    void open?.(node);
  };

  return (
    <div className="relative group aspect-[3/4] sm:aspect-[4/5]">
      <HoverPreviewPortal
        node={node}
        enabled={
          isMediaNode &&
          !isMobile &&
          !actionDropdownMenuOpen &&
          !actionContextMenuOpen
        }
      >
        <ActionContextMenu
          open={actionContextMenuOpen}
          onOpenChange={setActionContextMenuOpen}
          node={node}
          disabled={isMobile}
        >
          <div
            id={`media-item-${globalIndex}`}
            onMouseDown={start}
            onMouseUp={stop}
            onMouseLeave={stop}
            onTouchStart={start}
            onTouchEnd={stop}
            onTouchMove={stop}
            onClick={isMobile ? handleTap : handleClick}
            onDoubleClick={!isMobile ? handleDoubleClick : undefined}
            className={cn(
              "relative w-full h-full overflow-hidden rounded-xl border bg-card transition-all duration-200 select-none cursor-pointer",
              isSelected
                ? "ring-2 ring-primary border-transparent shadow-md scale-[0.98]"
                : "hover:border-primary/50 hover:shadow-sm"
            )}
          >
            <MediaThumb
              node={node}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              onError={() => void actions.updateThumb?.(node)}
              showIcon
            />

            {/* Overlay Gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-60" />

            {/* Selection UI */}
            <div
              className={cn(
                "absolute top-3 left-3 z-10 transition-opacity duration-200",
                selectCtx.isSelectionMode
                  ? "opacity-100"
                  : "opacity-0 group-hover:opacity-100"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <Checkbox
                checked={isSelected}
                className="h-5 w-5 border-white/50 data-[state=checked]:bg-primary"
              />
            </div>

            {/* Info Overlays */}
            <div className="absolute bottom-0 left-0 right-0 p-2 z-10">
              <MarqueeText
                text={node.title ?? node.name}
                className="text-[11px] font-medium text-white text-center"
              />
            </div>

            {/* Actions */}
            <div className="absolute top-2 right-2 flex flex-col items-end gap-2">
              {!selectCtx.isSelectionMode && isMediaNode && toggleFavorite && (
                <ToggleFavoriteButton
                  variant="grid"
                  rating={rating}
                  isFavorite={isFavorite}
                  onToggle={() => void toggleFavorite?.(node)}
                />
              )}

              {!selectCtx.isSelectionMode && (
                <div
                  className={cn(
                    "opacity-0 group-hover:opacity-100 transition-opacity",
                    isMobile && "opacity-100"
                  )}
                >
                  <ActionDropdownMenu
                    open={actionDropdownMenuOpen}
                    onOpenChange={setActionDropdownMenuOpen}
                    node={node}
                    className="h-8 w-8 bg-black/20 backdrop-blur-md hover:bg-black/40 border-none text-white rounded-full"
                  />
                </div>
              )}
            </div>

            {/* Badges */}
            <div className="absolute flex flex-col bottom-8 right-2 gap-1 items-end">
              {node.isDirectory && !!node.favoriteCount && (
                <FavoriteCountBadge count={node.favoriteCount} />
              )}
              {node.isDirectory && (
                <FolderStatusBadge date={node.lastViewedAt} />
              )}
            </div>
          </div>
        </ActionContextMenu>
      </HoverPreviewPortal>
    </div>
  );
}
