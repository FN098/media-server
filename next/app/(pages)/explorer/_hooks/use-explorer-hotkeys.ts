import { TagEditor } from "@/app/(pages)/(tag-editor)/_hooks/use-tag-editor";
import { ExplorerDialogs } from "@/app/(pages)/explorer/_hooks/use-explorer-dialogs";
import { ExplorerFiltering } from "@/app/(pages)/explorer/_hooks/use-explorer-filtering";
import { ExplorerNavigation } from "@/app/(pages)/explorer/_hooks/use-explorer-navigation";
import { Fullscreen } from "@/feature/general/hooks/use-fullscreen";
import { SearchFocus } from "@/feature/search/hooks/use-search-focus";
import { NodeSelectionControl } from "@/feature/selection/hooks/use-node-selection-control";
import { ViewerNavigation } from "@/feature/viewers/media-viewer/hooks/use-viewer-navigation";
import { NodeListing } from "@/lib/node/types";
import { useEffect, useMemo } from "react";
import { useHotkeys, useHotkeysContext } from "react-hotkeys-hook";

const ALL_SCOPES = ["explorer", "tag-editor", "viewer", "dialog"] as const;

interface UseExplorerHotkeysProps {
  enabled: boolean;
  listing: NodeListing;
  filtering: ExplorerFiltering;
  selection: NodeSelectionControl;
  dialogs: ExplorerDialogs;
  tagEditor: TagEditor;
  navigation: ExplorerNavigation;
  viewer: ViewerNavigation;
  fullscreen: Fullscreen;
  searchFocus: SearchFocus;
}

export function useExplorerHotkeys({
  enabled,
  listing,
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
    (e) => {
      e.preventDefault();
      if (selection.selectedNodes.length > 0) {
        console.log(selection.selectedNodes[0]);
        dialogs.renameDialog.open(selection.selectedNodes[0]);
      }
    },
    {
      scopes: ["explorer", "viewer"],
      enabled: enabled && selection.hasSelection,
    }
  );

  useHotkeys(
    "f7",
    (e) => {
      e.preventDefault();
      if (selection.selectedNodes.length > 0) {
        dialogs.moveDialog.open(selection.selectedNodes, listing.path);
      }
    },
    {
      scopes: ["explorer", "viewer"],
      enabled: enabled && selection.hasSelection,
    }
  );

  useHotkeys(
    "f8",
    (e) => {
      e.preventDefault();
      if (selection.selectedNodes.length > 0) {
        dialogs.copyDialog.open(selection.selectedNodes, listing.path);
      }
    },
    {
      scopes: ["explorer", "viewer"],
      enabled: enabled && selection.hasSelection,
    }
  );

  useHotkeys("ctrl+left", () => navigation.openPrevFolder("first"), {
    scopes: ["explorer", "viewer", "tag-editor"],
    enabled,
  });

  useHotkeys("ctrl+right", () => navigation.openNextFolder("first"), {
    scopes: ["explorer", "viewer", "tag-editor"],
    enabled,
  });

  useHotkeys("r", () => filtering.reset(), {
    scopes: ["explorer"],
    enabled: enabled && filtering.canReset,
  });
}
