import { usePagingViewContext } from "@/feature/paging-view/providers/paging-view-provider";
import { usePagingContext } from "@/feature/paging/providers/paging-provider";
import { useSelectionContext } from "@/feature/selection/providers/selection-provider";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export function usePagingGridView() {
  const {
    allNodes,
    initialScrollId,
    focusOnPageChange = false,
    onPageChange,
    onScrollRestored,
    onOpen,
  } = usePagingViewContext();

  const {
    page: currentPage,
    pageSize,
    totalPages,
    setPage,
    paginate,
  } = usePagingContext();

  const {
    lastSelectedId,
    setLastSelectedId,
    replaceSelection,
    anchorId,
    setAnchorId,
    enterSelectionMode,
    selectIds,
  } = useSelectionContext();

  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [columnCount, setColumnCount] = useState(0);
  const hasRestored = useRef(false);

  const currentNodes = useMemo(() => paginate(allNodes), [allNodes, paginate]);

  const indexMap = useMemo(
    () => new Map(allNodes.map((n, i) => [n.id, i])),
    [allNodes]
  );
  const getIndex = useCallback(
    (id: string) => indexMap.get(id) ?? -1,
    [indexMap]
  );

  const totalSize = useMemo(() => {
    return allNodes.reduce((acc, n) => acc + (n.size ?? 0), 0);
  }, [allNodes]);

  const initialScrollTargetIndex = useMemo(() => {
    if (!initialScrollId) return null;
    const index = getIndex(initialScrollId);
    return index !== -1 ? index : null;
  }, [getIndex, initialScrollId]);

  const [activeIndex, setActiveIndex] = useState(initialScrollTargetIndex ?? 0);

  // 初期スクロール対象に関する初期化処理
  useEffect(() => {
    if (initialScrollTargetIndex === null) return;
    const targetId = allNodes[initialScrollTargetIndex].id;
    setAnchorId(targetId);
    replaceSelection(targetId);
    setLastSelectedId(targetId);
  }, [
    initialScrollTargetIndex,
    allNodes,
    setAnchorId,
    replaceSelection,
    setLastSelectedId,
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

  const handlePageChange = useCallback(
    (page: number) => {
      setPage(page);
      onPageChange?.(page);
    },
    [onPageChange, setPage]
  );

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

      const currentId = lastSelectedId;
      const currentIndex = currentId ? getIndex(currentId) : -1;

      if (e.key === "Enter" && currentId) {
        const node = allNodes[currentIndex];
        if (node) onOpen?.(node);
        return;
      }

      if (currentIndex === -1) {
        const fallbackIndex = Math.max(0, activeIndex - 1);
        const fallback = allNodes[fallbackIndex];
        if (fallback) {
          replaceSelection(fallback.id);
          setLastSelectedId(fallback.id);
          setAnchorId(fallback.id);
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
        const id = anchorId ?? currentId;
        const anchorIndex = id ? getIndex(id) : 0;
        const start = Math.min(anchorIndex, nextIndex);
        const end = Math.max(anchorIndex, nextIndex);
        const ids = allNodes.slice(start, end + 1).map((n) => n.id);

        enterSelectionMode();
        selectIds(ids);
      } else {
        replaceSelection(nextNode.id);
        setAnchorId(nextNode.id);
      }

      setLastSelectedId(nextNode.id);
      setActiveIndex(nextIndex);

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
      lastSelectedId,
      columnCount,
      allNodes,
      setLastSelectedId,
      pageSize,
      currentPage,
      onOpen,
      activeIndex,
      replaceSelection,
      setAnchorId,
      anchorId,
      getIndex,
      enterSelectionMode,
      selectIds,
      setPage,
    ]
  );

  // キーボード操作によるページ変更時のコンテナフォーカスと位置復元
  useEffect(() => {
    if (focusOnPageChange) {
      containerRef.current?.focus({ preventScroll: true });
    }

    const currentId = lastSelectedId;
    if (!currentId) return;

    const currentIndex = getIndex(currentId);
    if (currentIndex === -1) return;

    requestAnimationFrame(() => {
      const el = document.getElementById(`media-item-${currentIndex}`);
      el?.scrollIntoView({ behavior: "instant", block: "nearest" });
    });
  }, [currentPage, focusOnPageChange, allNodes, lastSelectedId, getIndex]);

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
