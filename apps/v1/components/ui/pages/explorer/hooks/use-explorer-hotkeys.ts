import { ExplorerDialogs } from "@/components/ui/pages/explorer/hooks/use-explorer-dialogs";
import { ExplorerFiltering } from "@/components/ui/pages/explorer/hooks/use-explorer-filtering";
import { ExplorerNavigation } from "@/components/ui/pages/explorer/hooks/use-explorer-navigation";
import { ExplorerSelection } from "@/components/ui/pages/explorer/hooks/use-explorer-selection";
import { Fullscreen } from "@/hooks/use-fullscreen";
import { SearchFocus } from "@/hooks/use-search-focus";
import { TagEditorControl } from "@/hooks/use-tag-editor-control";
import { ViewerNavigation } from "@/hooks/use-viewer-control";
import { useEffect, useMemo } from "react";
import { useHotkeys, useHotkeysContext } from "react-hotkeys-hook";

const ALL_SCOPES = ["explorer", "tag-editor", "viewer", "dialog"] as const;

interface UseExplorerHotkeysProps {
  enabled: boolean;
  filtering: ExplorerFiltering;
  selection: ExplorerSelection;
  dialogs: ExplorerDialogs;
  tagEditor: TagEditorControl;
  navigation: ExplorerNavigation;
  viewer: ViewerNavigation;
  fullscreen: Fullscreen;
  searchFocus: SearchFocus;
}

export function useExplorerHotkeys({
  enabled,
  filtering,
  selection,
  dialogs,
  tagEditor,
  navigation,
  viewer,
  fullscreen,
  searchFocus,
}: UseExplorerHotkeysProps) {
  // スコープ切り替えフック
  const { enableScope, disableScope } = useHotkeysContext();

  // 現在のスコープ
  const activeScope = useMemo<(typeof ALL_SCOPES)[number]>(() => {
    if (dialogs.isOpen) return "dialog";
    else if (tagEditor.isOpen) return "tag-editor";
    else if (viewer.isOpen) return "viewer";
    else return "explorer";
  }, [dialogs.isOpen, tagEditor.isOpen, viewer.isOpen]);

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

  useHotkeys("escape", () => selection.reset(), {
    scopes: "explorer",
    enabled,
  });

  useHotkeys("backspace", () => navigation.openParentFolder(), {
    scopes: ["explorer"],
    enabled,
  });

  useHotkeys(
    "delete",
    () => dialogs.deleteDialog.open(selection.selectedNodes),
    {
      scopes: "explorer",
      enabled: enabled && selection.hasSelection,
    }
  );

  useHotkeys("t", () => tagEditor.toggle(), {
    scopes: ["explorer", "viewer", "tag-editor"],
    enabled,
  });

  useHotkeys("f", () => void fullscreen.toggle(), {
    scopes: ["explorer", "viewer", "tag-editor"],
    enabled,
  });

  useHotkeys(
    "ctrl+a",
    (e) => {
      e.preventDefault();
      selection.selectAll();
    },
    {
      scopes: ["explorer", "tag-editor"],
      enabled,
    }
  );

  useHotkeys(
    "ctrl+k",
    (e) => {
      e.preventDefault();
      searchFocus.trigger();
    },
    {
      scopes: "explorer",
      enabled,
    }
  );

  useHotkeys(
    "f2",
    () => dialogs.renameDialog.open(selection.selectedNodes[0]),
    {
      scopes: ["explorer", "viewer"],
      enabled: enabled && selection.hasSelection,
    }
  );

  useHotkeys("p", () => navigation.openPrevFolder("first"), {
    scopes: ["explorer", "viewer", "tag-editor"],
    enabled,
  });

  useHotkeys("n", () => navigation.openNextFolder("first"), {
    scopes: ["explorer", "viewer", "tag-editor"],
    enabled,
  });

  useHotkeys("r", () => filtering.reset(), {
    scopes: ["explorer"],
    enabled: enabled && filtering.canReset,
  });
}
