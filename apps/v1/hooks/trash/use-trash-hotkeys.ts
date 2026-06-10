import { Fullscreen } from "@/hooks/general/use-fullscreen";
import { ViewerNavigation } from "@/hooks/navigations/use-viewer-navigation";
import { SearchFocus } from "@/hooks/search/use-search-focus";
import { MediaNodeSelection } from "@/hooks/selections/use-media-node-selection";
import { TagEditor } from "@/hooks/tag-editor/use-tag-editor";
import { TrashDialogs } from "@/hooks/trash/use-trash-dialogs";
import { TrashFiltering } from "@/hooks/trash/use-trash-filtering";
import { TrashNavigation } from "@/hooks/trash/use-trash-navigation";
import { useEffect, useMemo } from "react";
import { useHotkeys, useHotkeysContext } from "react-hotkeys-hook";

const ALL_SCOPES = ["trash", "tag-editor", "viewer", "dialog"] as const;

interface UseTrashHotkeysProps {
  enabled: boolean;
  filtering: TrashFiltering;
  selection: MediaNodeSelection;
  dialogs: TrashDialogs;
  tagEditor: TagEditor;
  navigation: TrashNavigation;
  viewer: ViewerNavigation;
  fullscreen: Fullscreen;
  searchFocus: SearchFocus;
}

export function useTrashHotkeys({
  enabled,
  filtering,
  selection,
  dialogs,
  tagEditor,
  navigation,
  viewer,
  fullscreen,
  searchFocus,
}: UseTrashHotkeysProps) {
  // スコープ切り替えフック
  const { enableScope, disableScope } = useHotkeysContext();

  // 現在のスコープ
  const activeScope = useMemo<(typeof ALL_SCOPES)[number]>(() => {
    if (dialogs.isOpen) return "dialog";
    else if (tagEditor.isOpen) return "tag-editor";
    else if (viewer.isOpen) return "viewer";
    else return "trash";
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
    scopes: "trash",
    enabled,
  });

  useHotkeys("backspace", () => navigation.openParentFolder(), {
    scopes: ["trash"],
    enabled,
  });

  useHotkeys(
    "delete",
    () =>
      dialogs.deleteDialog.open(selection.selectedNodes, { isPermanent: true }),
    {
      scopes: "trash",
      enabled: enabled && selection.hasSelection,
    }
  );

  useHotkeys("t", () => tagEditor.toggle(), {
    scopes: ["trash", "viewer", "tag-editor"],
    enabled,
  });

  useHotkeys("f", () => void fullscreen.toggle(), {
    scopes: ["trash", "viewer", "tag-editor"],
    enabled,
  });

  useHotkeys(
    "ctrl+a",
    (e) => {
      e.preventDefault();
      selection.selectAll();
    },
    {
      scopes: ["trash", "tag-editor"],
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
      scopes: "trash",
      enabled,
    }
  );

  useHotkeys("ctrl+left", () => navigation.openPrevFolder("first"), {
    scopes: ["trash", "viewer", "tag-editor"],
    enabled,
  });

  useHotkeys("ctrl+right", () => navigation.openNextFolder("first"), {
    scopes: ["trash", "viewer", "tag-editor"],
    enabled,
  });

  useHotkeys("r", () => filtering.reset(), {
    scopes: ["trash"],
    enabled: enabled && filtering.canReset,
  });
}
