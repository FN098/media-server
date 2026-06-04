import { useLongPress } from "@/hooks/mobile/use-long-press";
import { isMedia } from "@/lib/media/detectors";
import { MediaNode } from "@/lib/media/types";
import { useFavoritesControlContext } from "@/providers/favorites-control-provider";
import { usePathSelectionContext } from "@/providers/path-selection-provider";
import { useCallback, useMemo, useState } from "react";

interface UseGridCellProps {
  node: MediaNode;
  globalIndex: number;
  allNodes: MediaNode[];
  isMobile: boolean;
  onSelectionChange?: () => void;
  onOpen?: (node: MediaNode) => void;
}

export function useGridCell({
  node,
  globalIndex,
  allNodes,
  isMobile,
  onSelectionChange,
  onOpen,
}: UseGridCellProps) {
  const isMediaNode = useMemo(() => isMedia(node.type), [node.type]);
  const { getFavorite, toggleFavorite } = useFavoritesControlContext();
  const { isFavorite, rating } = getFavorite(node.path);

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

  const handleDropdownMenuOpenChange = (open: boolean) => {
    if (open) {
      replaceSelection(node.path);
      setLastSelectedPath(node.path);
      onSelectionChange?.();
    }
    setDropdownMenuOpen(open);
  };

  const handleLongPress = () => {
    enterSelectionMode();
    replaceSelection(node.path);
    setLastSelectedPath(node.path);
    onSelectionChange?.();
  };

  const { start, stop, isLongPressed } = useLongPress({
    callback: handleLongPress,
    ms: 600,
  });

  const handleClick = (e: React.MouseEvent) => {
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
  };

  const handleContextMenu = (e: React.MouseEvent) => {
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
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (isMobile || e.ctrlKey || e.metaKey || e.shiftKey) return;
    e.preventDefault();
    onOpen?.(node);
  };

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
    isMediaNode,
    isFavorite,
    rating,
    isSelected,
    isSelectionMode,
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
  };
}
