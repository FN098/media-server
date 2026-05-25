"use client";

import { AverageRatingBadge } from "@/components/ui/badges/average-rating-badge";
import { FavoriteRatingDisplay } from "@/components/ui/badges/favorite-rating-display";
import { FolderStatusBadge } from "@/components/ui/badges/folder-status-badge";
import { SizeBar } from "@/components/ui/bars/size-bar";
import { FavoriteButton } from "@/components/ui/buttons/favorite-button";
import { FavoriteRatingInput } from "@/components/ui/buttons/favorite-rating-input";
import { ActionsContextMenu } from "@/components/ui/context-menus/actions-context-menu";
import { LocalDate } from "@/components/ui/dates/local-date";
import { ActionsDropdownMenu } from "@/components/ui/dropdown-menus/actions-dropdown-menu";
import { PagingControl } from "@/components/ui/paginations/pagination-control";
import { HoverPreviewPortal } from "@/components/ui/portals/hover-preview-portal";
import { MediaThumbIcon } from "@/components/ui/thumbnails/media-thumb-icons";
import { useLongPress } from "@/hooks/use-long-press";
import { isMedia } from "@/lib/media/media-types";
import { MediaNode } from "@/lib/media/types";
import { clamp } from "@/lib/utils/clamp";
import { getExtension } from "@/lib/utils/filename";
import { formatBytes } from "@/lib/utils/format";
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

// スマホ: Checkbox, Name, Rating, Actions
// タブレット: Checkbox, Name, Type, Size, Rating, Actions
// PC: Checkbox, Name, Type, Updated, Size, Last Viewed, Rating, Actions
const GRID_TEMPLATE = cn(
  "grid-cols-[40px_1fr_40px_80px]",
  "md:grid-cols-[40px_1fr_80px_180px_80px_80px]",
  "lg:grid-cols-[40px_1fr_80px_140px_180px_140px_80px_80px]"
);

interface PagingListViewProps {
  allNodes: MediaNode[];
  initialScrollPath?: string | null;
  focusOnPageChange?: boolean;
  onPageChange?: (page: number) => void;
  onScrollRestored?: () => void;
  onSelectionChange?: () => void;
  onOpen?: (node: MediaNode) => void;
  onThumbError?: (node: MediaNode) => void;
}

export function PagingListView({
  allNodes,
  initialScrollPath,
  focusOnPageChange = false,
  onPageChange,
  onScrollRestored,
  onSelectionChange,
  onOpen,
  onThumbError,
}: PagingListViewProps) {
  const { page, pageSize, totalPages, setPage, paginate } = usePagingContext();
  const currentPage = clamp(page, 1, totalPages);

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

  // 現在のページのノードを取得
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
  }, [currentPage, pageSize, initialScrollTargetIndex, onScrollRestored]);

  // ページ更新ハンドラ
  const handlePageChange = (page: number) => {
    setPage(page);
    onPageChange?.(page);
  };

  // キーボード操作ハンドラ
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const moveKeys = ["ArrowUp", "ArrowDown", "Enter"];
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
      if (e.key === "ArrowUp") nextIndex -= 1;
      if (e.key === "ArrowDown") nextIndex += 1;

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
        setPage(nextPage);
      }

      // DOMが更新されるタイミングでスクロール
      requestAnimationFrame(() => {
        const el = document.getElementById(`media-item-${nextIndex}`);
        el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    },
    [
      allNodes,
      anchorPath,
      currentPage,
      enterSelectionMode,
      lastSelectedPath,
      onOpen,
      pageSize,
      replaceSelection,
      selectPaths,
      setAnchorPath,
      setLastSelectedPath,
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
      className="w-full h-full flex flex-col bg-background outline-none"
      tabIndex={0} // フォーカス可能にし、keydownイベントを拾う
      onKeyDown={handleKeyDown}
    >
      <HeaderRow />

      <div className="flex-1 overflow-y-auto">
        {currentNodes.map((node, index) => (
          <DataRow
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
      />
    </div>
  );
}

function HeaderRow() {
  return (
    <div
      className={cn(
        "grid items-center h-10 border-b bg-muted/30 text-xs font-semibold text-muted-foreground z-10 min-w-0",
        GRID_TEMPLATE
      )}
    >
      <div className="flex justify-center">
        <Checkbox disabled className="opacity-50" />
      </div>
      <div>Name</div>
      <div className="hidden md:block">Type</div>
      <div className="hidden lg:block">Updated</div>
      <div className="hidden md:block">Size</div>
      <div className="hidden lg:block">Last Viewed</div>
      <div className="text-center">Rating</div>
      <div className="text-center">Actions</div>
    </div>
  );
}

interface DataRowProps {
  node: MediaNode;
  globalIndex: number;
  allNodes: MediaNode[];
  isMobile: boolean;
  totalSize: number;
  onSelectionChange?: () => void;
  onOpen?: (node: MediaNode) => void;
  onThumbError?: (node: MediaNode) => void;
}

function DataRow({
  node,
  globalIndex,
  allNodes,
  isMobile,
  totalSize,
  onSelectionChange,
  onOpen,
}: DataRowProps) {
  // メディア判定
  const isMediaNode = useMemo(() => isMedia(node.type), [node.type]);

  // お気に入り機能
  const { getFavorite, toggleFavorite, updateFavorite } = useFavoritesContext();
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
      // Shift選択
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
    <HoverPreviewPortal
      key={node.id}
      node={node}
      enabled={
        isMediaNode && !isMobile && !dropdownMenuOpen && !contextMenuOpen
      }
    >
      <ActionsContextMenu
        node={node}
        menuItems={menuItems}
        onOpenChange={setContextMenuOpen}
        disabled={isMobile}
      >
        <div
          id={`media-item-${globalIndex}`}
          role="row"
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
            "grid items-center h-12 border-b select-none cursor-pointer transition-colors text-sm",
            GRID_TEMPLATE,
            isSelected
              ? "bg-primary/10 hover:bg-primary/15"
              : "hover:bg-muted/50"
          )}
        >
          <div
            className="flex justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => {
                togglePath(node.path);
                onSelectionChange?.();
              }}
            />
          </div>

          {/* Icon + Name */}
          <div className="flex items-center gap-3 overflow-hidden pr-2">
            <MediaThumbIcon
              type={node.type}
              className="w-5 h-5 shrink-0 opacity-70"
            />
            <div className="flex flex-col min-w-0">
              <span className="truncate font-medium" title={title}>
                {title}
              </span>
              <span className="md:hidden text-[10px] text-muted-foreground truncate">
                {node.isDirectory
                  ? "Folder"
                  : `${getExtension(node.name)} • ${formatBytes(node.size)}`}
              </span>
            </div>
          </div>

          {/* Type */}
          <div className="hidden md:block text-muted-foreground text-xs uppercase">
            {node.isDirectory
              ? "Folder"
              : getExtension(node.name, { withDot: false })}
          </div>

          {/* Updated */}
          <div className="hidden lg:block text-muted-foreground text-xs tabular-nums">
            <LocalDate value={node.mtime} />
          </div>

          {/* Size */}
          <div className="hidden md:block min-w-0 overflow-hidden">
            <SizeBar
              pattern="A"
              size={node.size}
              fileCount={node.fileCount}
              occupancyPercent={occupancyPercent}
            />
          </div>

          {/* Last Viewed */}
          <div className="hidden lg:block text-muted-foreground text-xs tabular-nums">
            {node.isDirectory ? (
              <FolderStatusBadge
                date={node.lastViewedAt}
                className="border-none bg-transparent p-0"
              />
            ) : (
              "-"
            )}
          </div>

          {/* Rating */}
          <div
            className="flex justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <RatingCell
              node={node}
              rating={rating}
              isFavorite={isFavorite}
              toggleFavorite={toggleFavorite}
              updateFavorite={updateFavorite}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-center">
            <ActionsDropdownMenu
              node={node}
              menuItems={menuItems}
              open={dropdownMenuOpen}
              onOpenChange={handleDropdownMenuOpenChange}
            />
          </div>
        </div>
      </ActionsContextMenu>
    </HoverPreviewPortal>
  );
}

interface RatingCellProps {
  node: MediaNode;
  rating: number | null;
  isFavorite: boolean;
  toggleFavorite: (path: string) => Promise<unknown>;
  updateFavorite: (path: string, value: number | null) => Promise<unknown>;
}

function RatingCell({
  node,
  rating,
  isFavorite,
  toggleFavorite,
  updateFavorite,
}: RatingCellProps) {
  if (node.isDirectory) {
    if (!node.averageRating) {
      return <span className="italic text-muted-foreground">-</span>;
    }

    return (
      <>
        <FavoriteRatingDisplay
          value={node.averageRating}
          className="hidden md:flex"
        />
        <AverageRatingBadge
          rating={node.averageRating}
          className="flex md:hidden"
        />
      </>
    );
  }

  return (
    <>
      <FavoriteRatingInput
        value={rating}
        onChange={(value) => void updateFavorite(node.path, value)}
        className="hidden md:flex"
      />
      <FavoriteButton
        variant="list"
        rating={rating}
        isFavorite={isFavorite}
        onClick={() => void toggleFavorite(node.path)}
        className="flex md:hidden"
      />
    </>
  );
}
