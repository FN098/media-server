"use client";

import { FavoriteCountBadge } from "@/components/ui/badges/favorite-count-badge";
import { FolderStatusBadge } from "@/components/ui/badges/folder-status-badge";
import { FavoriteRating } from "@/components/ui/buttons/favorite-rating";
import { ToggleFavoriteButton } from "@/components/ui/buttons/toggle-favorite-button";
import { ActionContextMenu } from "@/components/ui/context-menus/action-context-menu";
import { LocalDate } from "@/components/ui/dates/local-date";
import { ActionDropdownMenu } from "@/components/ui/dropdown-menus/action-dropdown-menu";
import { PagingControl } from "@/components/ui/paginations/pagination-control";
import { HoverPreviewPortal } from "@/components/ui/portals/hover-preview-portal";
import { MediaThumbIcon } from "@/components/ui/thumbnails/media-thumb-icons";
import { useLongPress } from "@/hooks/use-long-press";
import { isMedia } from "@/lib/media/media-types";
import { MediaNode } from "@/lib/media/types";
import { getExtension } from "@/lib/utils/filename";
import { formatBytes } from "@/lib/utils/format";
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

interface PagingListViewProps {
  allNodes: MediaNode[];
  initialScrollPath?: string | null;
  onPageChange?: (page: number) => void;
  onScrollRestored?: () => void;
  focusOnPageChange?: boolean;
}

const GRID_TEMPLATE =
  "grid-cols-[40px_1fr_40px_80px] md:grid-cols-[40px_1fr_80px_140px_100px_140px_80px_80px]";

export function PagingListView({
  allNodes,
  initialScrollPath,
  onPageChange,
  onScrollRestored,
  focusOnPageChange = false,
}: PagingListViewProps) {
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

  // 現在のページのノードを取得
  const currentNodes = useMemo(() => paginate(allNodes), [allNodes, paginate]);

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

  // キーボード操作ハンドラ
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const moveKeys = ["ArrowUp", "ArrowDown", "Enter"];
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
      if (e.key === "ArrowUp") nextIndex -= 1;
      if (e.key === "ArrowDown") nextIndex += 1;

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
        setPage(nextPage);
      }

      // DOMが更新されるタイミングでスクロール
      requestAnimationFrame(() => {
        const el = document.getElementById(`media-item-${nextIndex}`);
        el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    },
    [selectCtx, allNodes, pageSize, currentPage, actions, setPage]
  );

  // ページ遷移時の自動スクロール（副作用）
  useEffect(() => {
    if (focusOnPageChange) {
      containerRef.current?.focus({ preventScroll: true });
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
        "grid items-center h-10 border-b bg-muted/30 text-xs font-semibold text-muted-foreground z-10",
        GRID_TEMPLATE
      )}
    >
      <div className="flex justify-center">
        <Checkbox disabled className="opacity-50" />
      </div>
      <div>Name</div>
      <div className="hidden md:block">Type</div>
      <div className="hidden md:block">Updated</div>
      <div className="hidden md:block">Size</div>
      <div className="hidden md:block">Last Viewed</div>
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
  onSelectionChange?: () => void;
}

function DataRow({
  node,
  globalIndex,
  allNodes,
  isMobile,
  onSelectionChange,
}: DataRowProps) {
  const isMediaNode = useMemo(() => isMedia(node.type), [node.type]);

  const favCtx = useFavoritesContext();
  const { isFavorite, rating } = favCtx.getFavorite(node.path);

  const selectCtx = usePathSelectionContext();
  const isSelected = selectCtx.isSelectedPath(node.path);

  const [actionDropdownMenuOpen, setActionDropdownMenuOpen] = useState(false);
  const [actionContextMenuOpen, setActionContextMenuOpen] = useState(false);
  const {
    actions: { open, toggleFavorite, changeRating },
  } = useActionsContext();

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
      // Shift選択
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
          role="row"
          onMouseDown={start}
          onMouseUp={stop}
          onMouseLeave={stop}
          onTouchStart={start}
          onTouchEnd={stop}
          onTouchMove={stop}
          onClick={isMobile ? handleTap : handleClick}
          onDoubleClick={!isMobile ? handleDoubleClick : undefined}
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
                selectCtx.togglePath(node.path);
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
              <span className="truncate font-medium">
                {node.title ?? node.name}
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
          <div className="hidden md:block text-muted-foreground text-xs tabular-nums">
            <LocalDate value={node.mtime} />
          </div>

          {/* Size */}
          <div className="hidden md:block text-muted-foreground text-xs tabular-nums">
            {node.isDirectory ? "-" : formatBytes(node.size)}
          </div>

          {/* Last Viewed */}
          <div className="hidden md:block flex items-center overflow-hidden">
            {node.isDirectory && (
              <FolderStatusBadge
                date={node.lastViewedAt}
                className="border-none bg-transparent p-0"
              />
            )}
          </div>

          {/* Rating */}
          <div
            className="flex justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {node.isDirectory ? (
              <FavoriteCountBadge count={node.favoriteCount ?? 0} />
            ) : isMobile && toggleFavorite ? (
              <ToggleFavoriteButton
                variant="list"
                rating={rating}
                isFavorite={isFavorite}
                onToggle={() => void toggleFavorite?.(node)}
              />
            ) : changeRating ? (
              <FavoriteRating
                rating={rating}
                onRatingChange={(rating) => void changeRating(node, rating)}
              />
            ) : null}
          </div>

          {/* Actions */}
          <div className="flex justify-center">
            <ActionDropdownMenu
              open={actionDropdownMenuOpen}
              onOpenChange={setActionDropdownMenuOpen}
              node={node}
            />
          </div>
        </div>
      </ActionContextMenu>
    </HoverPreviewPortal>
  );
}
