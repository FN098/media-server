import { useMediaNodePagingViewContext } from "@/providers/media-node-paging-view-provider";
import { usePagingContext } from "@/providers/paging-provider";
import { usePathSelectionContext } from "@/providers/path-selection-provider";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export function usePagingGridView() {
  const {
    allNodes,
    initialScrollPath,
    focusOnPageChange = false,
    onPageChange,
    onScrollRestored,
    onOpen,
  } = useMediaNodePagingViewContext();

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

  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [columnCount, setColumnCount] = useState(0);
  const hasRestored = useRef(false);

  const currentNodes = useMemo(() => paginate(allNodes), [allNodes, paginate]);

  const totalSize = useMemo(() => {
    return allNodes.reduce((acc, n) => acc + (n.size ?? 0), 0);
  }, [allNodes]);

  const initialScrollTargetIndex = useMemo(() => {
    if (!initialScrollPath) return null;
    const index = allNodes.findIndex((n) => n.path === initialScrollPath);
    return index !== -1 ? index : null;
  }, [allNodes, initialScrollPath]);

  // 初期スクロール対象に関する初期化処理
  useEffect(() => {
    if (initialScrollTargetIndex === null) return;
    const targetPath = allNodes[initialScrollTargetIndex].path;
    setAnchorPath(targetPath);
    replaceSelection(targetPath);
    setLastSelectedPath(targetPath);
  }, [
    initialScrollTargetIndex,
    allNodes,
    setAnchorPath,
    replaceSelection,
    setLastSelectedPath,
  ]);

  const initialScrollTargetPage = useMemo(() => {
    if (initialScrollTargetIndex === null) return null;
    return Math.floor(initialScrollTargetIndex / pageSize) + 1;
  }, [pageSize, initialScrollTargetIndex]);

  // 初期ページ遷移
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

  // 初期スクロール実行
  useEffect(() => {
    if (hasRestored.current || initialScrollTargetIndex === null) return;

    const pageStart = (currentPage - 1) * pageSize;
    const pageEnd = pageStart + pageSize;

    if (
      initialScrollTargetIndex >= pageStart &&
      initialScrollTargetIndex < pageEnd
    ) {
      const element = document.getElementById(
        `media-item-${initialScrollTargetIndex}`
      );
      if (element) {
        element.scrollIntoView({ behavior: "instant", block: "center" });
        hasRestored.current = true;
        onScrollRestored?.();
      }
    }
  }, [currentPage, pageSize, initialScrollTargetIndex, onScrollRestored]);

  const handlePageChange = (page: number) => {
    setPage(page);
    onPageChange?.(page);
  };

  // リサイズ監視による列数計算
  useEffect(() => {
    const updateColumns = () => {
      if (gridRef.current) {
        // gridRef の直下の .grid 要素（なければ gridRef 自身）のスタイルを取得
        const gridStyle = window.getComputedStyle(
          gridRef.current.querySelector(":scope > .grid") ?? gridRef.current
        );
        // grid 列のピクセル数情報（例. 120px 120px 120px 120px）から、現在の列数を計算
        const cols = gridStyle.gridTemplateColumns.split(" ").length;
        setColumnCount(cols || 1);
      }
    };

    const observer = new ResizeObserver(updateColumns);
    if (gridRef.current) observer.observe(gridRef.current);
    updateColumns();
    return () => observer.disconnect();
  }, []);

  // キーボードハンドラ
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
      const currentPath = lastSelectedPath;
      const currentIndex = allNodes.findIndex((n) => n.path === currentPath);

      if (e.key === "Enter" && currentPath) {
        const node = allNodes[currentIndex];
        if (node) onOpen?.(node);
        return;
      }

      if (currentIndex === -1) {
        const first = allNodes[0];
        if (first) {
          replaceSelection(first.path);
          setLastSelectedPath(first.path);
          setAnchorPath(first.path);
        }
        return;
      }

      let nextIndex = currentIndex;
      if (e.key === "ArrowLeft") nextIndex -= 1;
      if (e.key === "ArrowRight") nextIndex += 1;
      if (e.key === "ArrowUp") nextIndex -= columnCount;
      if (e.key === "ArrowDown") nextIndex += columnCount;

      if (nextIndex < 0 || nextIndex >= allNodes.length) return;

      const nextNode = allNodes[nextIndex];

      if (e.shiftKey) {
        const path = anchorPath ?? currentPath;
        const anchorIndex = allNodes.findIndex((n) => n.path === path);
        const start = Math.min(anchorIndex, nextIndex);
        const end = Math.max(anchorIndex, nextIndex);
        const paths = allNodes.slice(start, end + 1).map((n) => n.path);

        enterSelectionMode();
        selectPaths(paths);
      } else {
        replaceSelection(nextNode.path);
        setAnchorPath(nextNode.path);
      }

      setLastSelectedPath(nextNode.path);

      const nextPage = Math.floor(nextIndex / pageSize) + 1;
      if (nextPage !== currentPage) {
        setPage(nextPage);
      }

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

  // キーボード操作によるページ変更時のコンテナフォーカスと位置復元
  useEffect(() => {
    if (focusOnPageChange) {
      containerRef.current?.focus({ preventScroll: true });
    }

    const currentPath = lastSelectedPath;
    if (!currentPath) return;

    const currentIndex = allNodes.findIndex((n) => n.path === currentPath);
    if (currentIndex === -1) return;

    requestAnimationFrame(() => {
      const el = document.getElementById(`media-item-${currentIndex}`);
      el?.scrollIntoView({ behavior: "instant", block: "nearest" });
    });
  }, [currentPage, focusOnPageChange, allNodes, lastSelectedPath]);

  return {
    containerRef,
    gridRef,
    currentNodes,
    totalSize,
    currentPage,
    totalPages,
    pageSize,
    handlePageChange,
    handleKeyDown,
  };
}
