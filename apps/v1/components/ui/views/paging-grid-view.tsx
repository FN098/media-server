"use client";

import { AverageRatingBadge } from "@/components/ui/badges/average-rating-badge";
import { FolderStatusBadge } from "@/components/ui/badges/folder-status-badge";
import { FavoriteButton } from "@/components/ui/buttons/favorite-button";
import { NodeContextMenu } from "@/components/ui/context-menus/node-context-menu";
import { NodeDropdownMenu } from "@/components/ui/dropdown-menus/node-dropdown-menu";
import { PagingControl } from "@/components/ui/paginations/pagination-control";
import { HoverPreviewPortal } from "@/components/ui/portals/hover-preview-portal";
import { MarqueeText } from "@/components/ui/texts/marquee-text";
import { MediaThumb } from "@/components/ui/thumbnails/media-thumb";
import { useLongPress } from "@/hooks/mobile/use-long-press";
import { isMedia } from "@/lib/media/detectors";
import { MediaNode } from "@/lib/media/types";
import { formatBytes } from "@/lib/utils/bytes";
import { useFavoritesContext } from "@/providers/favorites-provider";
import { useMenuItemsContext } from "@/providers/menu-items-provider";
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
  focusOnPageChange?: boolean;
  onPageChange?: (page: number) => void;
  onScrollRestored?: () => void;
  onSelectionChange?: () => void;
  onOpen?: (node: MediaNode) => void;
  onThumbError?: (node: MediaNode) => void;
}

export function PagingGridView({
  allNodes,
  initialScrollPath,
  focusOnPageChange = false,
  onPageChange,
  onScrollRestored,
  onSelectionChange,
  onOpen,
  onThumbError,
}: PagingGridViewProps) {
  const {
    page: currentPage,
    pageSize,
    totalPages,
    setPage,
    paginate,
  } = usePagingContext();

  const {
    lastSelectedPath,
    setLastSelectedPath,
    replaceSelection,
    anchorPath,
    setAnchorPath,
    enterSelectionMode,
    selectPaths,
  } = usePathSelectionContext();

  const isMobile = useIsMobile();

  // 現在のページのノード
  const currentNodes = useMemo(() => paginate(allNodes), [allNodes, paginate]);

  //合計サイズを計算（比率計算の基準値）
  const { totalSize } = useMemo(() => {
    const sizes = allNodes.map((n) => n.size ?? 0);
    return {
      totalSize: sizes.reduce((acc, size) => acc + size, 0),
    };
  }, [allNodes]);

  // ビューコンテナ
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

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

  // 初期スクロール対象をアンカーに設定
  useEffect(() => {
    if (!initialScrollTargetIndex) return;
    setAnchorPath(allNodes[initialScrollTargetIndex].path);
  }, [initialScrollTargetIndex, allNodes, setAnchorPath]);

  // 初期スクロール対象を選択状態に設定
  useEffect(() => {
    if (!initialScrollTargetIndex) return;
    replaceSelection(allNodes[initialScrollTargetIndex].path);
  }, [initialScrollTargetIndex, allNodes, replaceSelection]);

  // 初期スクロール対象を最終選択パスに設定
  useEffect(() => {
    if (!initialScrollTargetIndex) return;
    setLastSelectedPath(allNodes[initialScrollTargetIndex].path);
  }, [initialScrollTargetIndex, allNodes, setLastSelectedPath]);

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
        element.scrollIntoView({ behavior: "instant", block: "nearest" });

        // フラグを立てて、二度と実行されないようにする
        hasRestored.current = true;
        onScrollRestored?.();
      }
    }
  }, [
    currentPage,
    pageSize,
    initialScrollTargetIndex,
    onScrollRestored,
    replaceSelection,
    allNodes,
  ]);

  // ページ更新ハンドラ
  const handlePageChange = (page: number) => {
    setPage(page);
    onPageChange?.(page);
  };

  // 列数の動的計算
  useEffect(() => {
    const updateColumns = () => {
      if (gridRef.current) {
        const gridStyle = window.getComputedStyle(
          gridRef.current.querySelector(":scope > .grid") ?? gridRef.current
        );
        const cols = gridStyle.gridTemplateColumns.split(" ").length;
        setColumnCount(cols || 1);
      }
    };

    const observer = new ResizeObserver(updateColumns);
    if (gridRef.current) observer.observe(gridRef.current);
    updateColumns();
    return () => observer.disconnect();
  }, []);

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
      const currentPath = lastSelectedPath;
      const currentIndex = allNodes.findIndex((n) => n.path === currentPath);

      // Enterで開く
      if (e.key === "Enter" && currentPath) {
        const node = allNodes[currentIndex];
        if (node) onOpen?.(node);
        return;
      }

      // 何も選択されていない場合は最初の要素を選択
      if (currentIndex === -1) {
        const first = allNodes[0];
        if (first) {
          replaceSelection(first.path);
          setLastSelectedPath(first.path);
          setAnchorPath(first.path);
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
        const path = anchorPath ?? currentPath;
        const anchorIndex = allNodes.findIndex((n) => n.path === path);

        const start = Math.min(anchorIndex, nextIndex);
        const end = Math.max(anchorIndex, nextIndex);
        const paths = allNodes.slice(start, end + 1).map((n) => n.path);

        enterSelectionMode();
        selectPaths(paths); // 範囲で上書き
        // ※ setAnchorPath は更新しない (起点を維持)
      } else {
        // 通常移動
        replaceSelection(nextNode.path);
        setAnchorPath(nextNode.path); // 次のShift操作のために起点を更新
      }

      // フォーカス位置更新
      setLastSelectedPath(nextNode.path);

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
    [
      lastSelectedPath,
      allNodes,
      columnCount,
      setLastSelectedPath,
      pageSize,
      currentPage,
      onOpen,
      replaceSelection,
      setAnchorPath,
      enterSelectionMode,
      selectPaths,
      anchorPath,
      setPage,
    ]
  );

  // ページ遷移時の自動スクロール（副作用）
  useEffect(() => {
    if (focusOnPageChange) {
      containerRef.current?.focus({ preventScroll: true });
    }

    // ページ変更に伴うスクロールが必要な場合、または外部からの指示（初期表示など）
    // lastSelectedPath があれば、その要素へスクロールを試みる
    const currentPath = lastSelectedPath;
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
        ref={gridRef}
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
            totalSize={totalSize}
            onOpen={onOpen}
            onSelectionChange={onSelectionChange}
            onThumbError={onThumbError}
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
  totalSize: number;
  onSelectionChange?: () => void;
  onOpen?: (node: MediaNode) => void;
  onThumbError?: (node: MediaNode) => void;
}

function Cell({
  node,
  globalIndex,
  allNodes,
  isMobile,
  totalSize,
  onSelectionChange,
  onOpen,
  onThumbError,
}: CellProps) {
  // メディア判定
  const isMediaNode = useMemo(() => isMedia(node.type), [node.type]);

  // お気に入り機能
  const { getFavorite, toggleFavorite } = useFavoritesContext();
  const { isFavorite, rating } = getFavorite(node.path);

  // 選択機能
  const {
    isSelectedPath,
    replaceSelection,
    setLastSelectedPath,
    anchorPath,
    setAnchorPath,
    enterSelectionMode,
    exitSelectionMode,
    togglePath,
    selectPath,
    unselectPath,
    selectedPaths,
    deletePaths,
    selectPaths,
    isSelectionMode,
  } = usePathSelectionContext();
  const isSelected = isSelectedPath(node.path);

  // メニュー
  const { items: menuItems } = useMenuItemsContext();
  const [dropdownMenuOpen, setDropdownMenuOpen] = useState(false);
  const [contextMenuOpen, setContextMenuOpen] = useState(false);

  // ドロップダウンメニュー表示で選択切り替え
  const handleDropdownMenuOpenChange = (open: boolean) => {
    if (open) {
      replaceSelection(node.path);
      setLastSelectedPath(node.path);
      onSelectionChange?.();
    }
    setDropdownMenuOpen(open);
  };

  // 長押しで選択モード
  const handleLongPress = () => {
    enterSelectionMode();
    replaceSelection(node.path);
    setLastSelectedPath(node.path);
    onSelectionChange?.();
  };

  // 長押し判定
  const { start, stop, isLongPressed } = useLongPress({
    callback: handleLongPress,
    ms: 600,
  });

  // クリックで選択（PC）
  const handleClick = (e: React.MouseEvent) => {
    if (isLongPressed || isMobile) return;
    e.preventDefault();

    if (e.shiftKey && anchorPath !== null) {
      // Shift 選択
      enterSelectionMode();
      const anchorIdx = allNodes.findIndex((n) => n.path === anchorPath);
      if (anchorIdx === -1) return;
      const startIdx = Math.min(anchorIdx, globalIndex);
      const endIdx = Math.max(anchorIdx, globalIndex);
      const paths = allNodes.slice(startIdx, endIdx + 1).map((n) => n.path);

      if (e.ctrlKey || e.metaKey) {
        // Ctrl あり
        deletePaths(paths);
      } else {
        // Shift のみ
        enterSelectionMode();
        selectPaths(paths);
      }
    } else if (e.ctrlKey || e.metaKey) {
      // Ctrl選択
      enterSelectionMode();
      togglePath(node.path);
      setAnchorPath(node.path); // 次のShift操作の起点更新
    } else {
      // 通常選択
      exitSelectionMode();
      replaceSelection(node.path);
      setAnchorPath(node.path); // 次のShift操作の起点更新
    }

    setLastSelectedPath(node.path);
    onSelectionChange?.();
  };

  // 右クリックで選択（PC）
  const handleContextMenu = (e: React.MouseEvent) => {
    if (isMobile) return;

    if (e.shiftKey && anchorPath !== null) {
      // Shift: アンカーから範囲選択
      enterSelectionMode();
      const anchorIdx = allNodes.findIndex((n) => n.path === anchorPath);
      if (anchorIdx !== -1) {
        const startIdx = Math.min(anchorIdx, globalIndex);
        const endIdx = Math.max(anchorIdx, globalIndex);
        const paths = allNodes.slice(startIdx, endIdx + 1).map((n) => n.path);
        selectPaths(paths);
      }
    } else if (e.ctrlKey || e.metaKey) {
      // Ctrl: トグル追加
      enterSelectionMode();
      togglePath(node.path);
      setAnchorPath(node.path);
    } else {
      // 通常: 未選択なら単独選択、選択済みなら維持（複数選択を崩さない）
      if (!isSelected) {
        exitSelectionMode();
        replaceSelection(node.path);
        setAnchorPath(node.path);
      }
    }

    setLastSelectedPath(node.path);
    onSelectionChange?.();
  };

  // ダブルクリックで開く（PC）
  const handleDoubleClick = (e: React.MouseEvent) => {
    if (isMobile || e.ctrlKey || e.metaKey || e.shiftKey) return;
    e.preventDefault();
    onOpen?.(node);
  };

  // タップで開く（モバイル）
  const handleTap = (e: React.MouseEvent) => {
    if (isLongPressed || !isMobile) return;
    e.preventDefault();

    if (isSelectionMode) {
      if (!isSelected) {
        selectPath(node.path);
      } else {
        unselectPath(node.path);
        if (selectedPaths.size === 1 && selectedPaths.has(node.path)) {
          exitSelectionMode();
        }
      }
      onSelectionChange?.();
      return;
    }

    onOpen?.(node);
  };

  // 合計サイズに対するこのノードの占有率（%）
  const occupancyPercent = useMemo(() => {
    if (!node.size || totalSize === 0) return 0;
    return (node.size / totalSize) * 100;
  }, [node.size, totalSize]);

  const title = node.title ?? node.name;

  return (
    <div className="relative group aspect-[3/4] sm:aspect-[4/5]">
      <HoverPreviewPortal
        key={node.id}
        node={node}
        enabled={
          isMediaNode && !isMobile && !dropdownMenuOpen && !contextMenuOpen
        }
      >
        <NodeContextMenu
          node={node}
          menuItems={menuItems}
          onOpenChange={setContextMenuOpen}
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
            onContextMenu={!isMobile ? handleContextMenu : undefined}
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
              onError={() => onThumbError?.(node)}
              showIcon
            />

            {/* Overlay Gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-60" />

            {/* Selection UI */}
            <div
              className={cn(
                "absolute top-3 left-3 z-10 transition-opacity duration-200",
                isSelectionMode
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
            <div
              className="absolute bottom-0 left-0 right-0 p-2 z-10"
              title={title}
            >
              <MarqueeText className="text-[11px] font-medium text-white text-center">
                {title}
              </MarqueeText>
            </div>

            {/* Actions */}
            <div className="absolute top-2 right-2 flex flex-col items-end gap-2">
              {!isSelectionMode && isMediaNode && (
                <FavoriteButton
                  variant="small"
                  rating={rating}
                  isFavorite={isFavorite}
                  onClick={() => void toggleFavorite(node.path)}
                />
              )}

              {!isSelectionMode && (
                <div
                  className={cn(
                    "opacity-0 group-hover:opacity-100 transition-opacity",
                    isMobile && "opacity-100"
                  )}
                >
                  <NodeDropdownMenu
                    node={node}
                    menuItems={menuItems}
                    open={dropdownMenuOpen}
                    onOpenChange={handleDropdownMenuOpenChange}
                    className="h-8 w-8 bg-black/20 backdrop-blur-md hover:bg-black/40 border-none text-white rounded-full"
                  />
                </div>
              )}
            </div>

            {/* Badges — 右下 */}
            <div className="absolute flex flex-col bottom-8 right-2 gap-1 items-end">
              {node.isDirectory && node.averageRating && (
                <AverageRatingBadge rating={node.averageRating} />
              )}
              {node.isDirectory && (
                <FolderStatusBadge date={node.lastViewedAt} />
              )}
            </div>

            {/* Size / FileCount / Occupancy — 左下 */}
            <div className="absolute bottom-8 left-2 flex flex-col gap-1 items-start z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {node.fileCount != null && (
                <span className="text-[10px] text-white/80 bg-black/40 backdrop-blur-sm rounded px-1.5 py-0.5 tabular-nums leading-none">
                  {node.fileCount} files
                </span>
              )}

              {node.size != null && (
                <span className="text-[10px] text-white/80 bg-black/40 backdrop-blur-sm rounded px-1.5 py-0.5 tabular-nums leading-none">
                  {formatBytes(node.size)}
                </span>
              )}

              {occupancyPercent > 0 && (
                <span className="text-[10px] text-white/70 bg-black/30 backdrop-blur-sm rounded px-1.5 py-0.5 tabular-nums leading-none">
                  {occupancyPercent.toFixed(1)}%
                </span>
              )}
            </div>
          </div>
        </NodeContextMenu>
      </HoverPreviewPortal>
    </div>
  );
}
