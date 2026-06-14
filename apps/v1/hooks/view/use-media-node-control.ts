import { usePercent } from "@/hooks/general/use-percent";
import { useLongPress } from "@/hooks/mobile/use-long-press";
import { isMedia } from "@/lib/media/detectors";
import { MediaNode } from "@/lib/media/types";
import { useFavoritesControlContext } from "@/providers/favorites-control-provider";
import { useDetectMobileContext } from "@/providers/mobile-provider";
import { usePathSelectionContext } from "@/providers/path-selection-provider";
import { useCallback, useMemo, useState } from "react";

export interface UseMediaNodeControlProps {
  node: MediaNode;
  globalIndex: number;
  allNodes: MediaNode[];
  totalSize: number;
  onSelectionChange?: () => void;
  onOpen?: (node: MediaNode) => void;
}

export function useMediaNodeControl({
  node,
  globalIndex,
  allNodes,
  totalSize,
  onSelectionChange,
  onOpen,
}: UseMediaNodeControlProps) {
  const isMediaNode = useMemo(() => isMedia(node.type), [node.type]);
  const isMobile = useDetectMobileContext();

  const { getFavorite, toggleFavorite, updateFavorite } =
    useFavoritesControlContext();

  const { isFavorite, rating } = useMemo(
    () => getFavorite(node.path),
    [getFavorite, node.path]
  );

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
  const [dropdownMenuOpen, setDropdownMenuOpen] = useState(false);
  const [contextMenuOpen, setContextMenuOpen] = useState(false);

  const occupancyPercent = usePercent({
    value: node.size ?? 0,
    total: totalSize,
  });

  const handleDropdownMenuOpenChange = useCallback(
    (open: boolean) => {
      if (open) {
        replaceSelection(node.path);
        setLastSelectedPath(node.path);
        onSelectionChange?.();
      }
      setDropdownMenuOpen(open);
    },
    [node.path, onSelectionChange, replaceSelection, setLastSelectedPath]
  );

  const handleLongPress = useCallback(() => {
    enterSelectionMode();
    replaceSelection(node.path);
    setLastSelectedPath(node.path);
    onSelectionChange?.();
  }, [
    enterSelectionMode,
    node.path,
    onSelectionChange,
    replaceSelection,
    setLastSelectedPath,
  ]);

  const { start, stop, isLongPressed } = useLongPress({
    callback: handleLongPress,
    ms: 600,
  });

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (isLongPressed || isMobile) return;
      e.preventDefault();

      if (e.shiftKey && anchorPath !== null) {
        enterSelectionMode();
        const anchorIdx = allNodes.findIndex((n) => n.path === anchorPath);
        if (anchorIdx === -1) return;
        const startIdx = Math.min(anchorIdx, globalIndex);
        const endIdx = Math.max(anchorIdx, globalIndex);
        const paths = allNodes.slice(startIdx, endIdx + 1).map((n) => n.path);

        if (e.ctrlKey || e.metaKey) {
          deletePaths(paths);
        } else {
          selectPaths(paths);
        }
      } else if (e.ctrlKey || e.metaKey) {
        enterSelectionMode();
        togglePath(node.path);
        setAnchorPath(node.path);
      } else {
        exitSelectionMode();
        replaceSelection(node.path);
        setAnchorPath(node.path);
      }

      setLastSelectedPath(node.path);
      onSelectionChange?.();
    },
    [
      allNodes,
      anchorPath,
      deletePaths,
      enterSelectionMode,
      exitSelectionMode,
      globalIndex,
      isLongPressed,
      isMobile,
      node.path,
      onSelectionChange,
      replaceSelection,
      selectPaths,
      setAnchorPath,
      setLastSelectedPath,
      togglePath,
    ]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (isMobile) return;

      if (e.shiftKey && anchorPath !== null) {
        enterSelectionMode();
        const anchorIdx = allNodes.findIndex((n) => n.path === anchorPath);
        if (anchorIdx !== -1) {
          const startIdx = Math.min(anchorIdx, globalIndex);
          const endIdx = Math.max(anchorIdx, globalIndex);
          const paths = allNodes.slice(startIdx, endIdx + 1).map((n) => n.path);
          selectPaths(paths);
        }
      } else if (e.ctrlKey || e.metaKey) {
        enterSelectionMode();
        togglePath(node.path);
        setAnchorPath(node.path);
      } else {
        if (!isSelected) {
          exitSelectionMode();
          replaceSelection(node.path);
          setAnchorPath(node.path);
        }
      }

      setLastSelectedPath(node.path);
      onSelectionChange?.();
    },
    [
      allNodes,
      anchorPath,
      enterSelectionMode,
      exitSelectionMode,
      globalIndex,
      isMobile,
      isSelected,
      node.path,
      onSelectionChange,
      replaceSelection,
      selectPaths,
      setAnchorPath,
      setLastSelectedPath,
      togglePath,
    ]
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (isMobile || e.ctrlKey || e.metaKey || e.shiftKey) return;
      e.preventDefault();
      onOpen?.(node);
    },
    [isMobile, node, onOpen]
  );

  const handleTap = useCallback(
    (e: React.MouseEvent) => {
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
    },
    [
      exitSelectionMode,
      isLongPressed,
      isMobile,
      isSelected,
      isSelectionMode,
      node,
      onOpen,
      onSelectionChange,
      selectPath,
      selectedPaths,
      unselectPath,
    ]
  );

  const toggleSelection = useCallback(() => {
    enterSelectionMode();
    togglePath(node.path);
    setAnchorPath(node.path);
    setLastSelectedPath(node.path);
    onSelectionChange?.();
  }, [
    node.path,
    enterSelectionMode,
    togglePath,
    setAnchorPath,
    setLastSelectedPath,
    onSelectionChange,
  ]);

  return {
    node,
    globalIndex,
    isMediaNode,
    isFavorite,
    rating,
    isSelected,
    occupancyPercent,
    title: node.title ?? node.name,
    dropdownMenuOpen,
    contextMenuOpen,
    setContextMenuOpen,
    handleDropdownMenuOpenChange,
    longPressProps: {
      onMouseDown: start,
      onMouseUp: stop,
      onMouseLeave: stop,
      onTouchStart: start,
      onTouchEnd: stop,
      onTouchMove: stop,
    },
    handleClick: isMobile ? handleTap : handleClick,
    handleDoubleClick: !isMobile ? handleDoubleClick : undefined,
    handleContextMenu: !isMobile ? handleContextMenu : undefined,
    toggleFavorite: () => void toggleFavorite(node.path),
    toggleSelection,
    updateFavorite,
  };
}
