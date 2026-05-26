"use client";

import { useEffect, useMemo } from "react";
import { useHotkeys, useHotkeysContext } from "react-hotkeys-hook";

const ALL_SCOPES = ["explorer", "tag-editor", "viewer", "dialog"] as const;

interface UseExplorerHotkeysProps {
  enabled: boolean;
  isDialogMode: boolean;
  isTagEditorMode: boolean;
  isViewerMode: boolean;
  onResetSelection: () => void;
  onGoBack: () => void;
  onDelete: () => void;
  onEditTags: () => void;
  onToggleFullscreen: () => void;
  onSelectAll: () => void;
  onFocusSearch: () => void;
  onRename: () => void;
  onOpenPrevFolder: () => void;
  onOpenNextFolder: () => void;
  onResetFilter: () => void;
}

export function useExplorerHotkeys({
  enabled,
  isDialogMode,
  isTagEditorMode,
  isViewerMode,
  onResetSelection,
  onGoBack,
  onDelete,
  onEditTags,
  onToggleFullscreen,
  onSelectAll,
  onFocusSearch,
  onRename,
  onOpenPrevFolder,
  onOpenNextFolder,
  onResetFilter,
}: UseExplorerHotkeysProps) {
  // スコープ切り替えフック
  const { enableScope, disableScope } = useHotkeysContext();

  // 現在のスコープ
  const activeScope = useMemo<(typeof ALL_SCOPES)[number]>(() => {
    if (isDialogMode) return "dialog";
    else if (isTagEditorMode) return "tag-editor";
    else if (isViewerMode) return "viewer";
    else return "explorer";
  }, [isDialogMode, isTagEditorMode, isViewerMode]);

  // スコープの排他的制御
  useEffect(() => {
    // 該当スコープを有効にし、それ以外を無効にする
    ALL_SCOPES.forEach((s) => {
      if (s === activeScope) {
        enableScope(s);
      } else {
        disableScope(s);
      }
    });
  }, [activeScope, disableScope, enableScope]);

  useHotkeys("escape", () => onResetSelection(), {
    scopes: "explorer",
    enabled,
  });

  useHotkeys("backspace", () => onGoBack(), {
    scopes: ["explorer"],
  });

  useHotkeys("delete", () => onDelete(), {
    scopes: "explorer",
  });

  useHotkeys("t", () => onEditTags(), {
    scopes: ["explorer", "viewer", "tag-editor"],
  });

  useHotkeys("f", () => onToggleFullscreen(), {
    scopes: ["explorer", "viewer", "tag-editor"],
  });

  useHotkeys(
    "ctrl+a",
    (e) => {
      e.preventDefault();
      onSelectAll();
    },
    { scopes: ["explorer", "tag-editor"] }
  );

  useHotkeys(
    "ctrl+k",
    (e) => {
      e.preventDefault();
      onFocusSearch();
    },
    { scopes: "explorer" }
  );

  useHotkeys("f2", () => onRename(), {
    scopes: ["explorer", "viewer"],
  });

  useHotkeys("p", () => onOpenPrevFolder, {
    scopes: ["explorer", "viewer", "tag-editor"],
  });

  useHotkeys("n", () => onOpenNextFolder(), {
    scopes: ["explorer", "viewer", "tag-editor"],
  });

  useHotkeys("r", () => onResetFilter(), {
    scopes: ["explorer"],
  });
}
