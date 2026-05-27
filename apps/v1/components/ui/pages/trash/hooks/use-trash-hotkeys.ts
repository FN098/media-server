import { TrashDialogs } from "@/components/ui/pages/trash/hooks/use-trash-dialogs";
import { TrashFiltering } from "@/components/ui/pages/trash/hooks/use-trash-filtering";
import { TrashNavigation } from "@/components/ui/pages/trash/hooks/use-trash-navigation";
import { TrashSelection } from "@/components/ui/pages/trash/hooks/use-trash-selection";
import { Fullscreen } from "@/hooks/use-fullscreen";
import { SearchFocus } from "@/hooks/use-search-focus";
import { TagEditorControl } from "@/hooks/use-tag-editor-control";
import { ViewerNavigation } from "@/hooks/use-viewer-control";
import { useEffect, useMemo } from "react";
import { useHotkeys, useHotkeysContext } from "react-hotkeys-hook";

const ALL_SCOPES = ["trash", "tag-editor", "viewer", "dialog"] as const;

interface UseTrashHotkeysProps {
  enabled: boolean;
  filtering: TrashFiltering;
  selection: TrashSelection;
  dialogs: TrashDialogs;
  tagEditor: TagEditorControl;
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
  });

  useHotkeys("delete", () => dialogs.deleteDialog.openSelected(), {
    scopes: "trash",
  });

  useHotkeys("t", () => tagEditor.toggle(), {
    scopes: ["trash", "viewer", "tag-editor"],
  });

  useHotkeys("f", () => void fullscreen.toggle(), {
    scopes: ["trash", "viewer", "tag-editor"],
  });

  useHotkeys(
    "ctrl+a",
    (e) => {
      e.preventDefault();
      selection.selectAll();
    },
    { scopes: ["trash", "tag-editor"] }
  );

  useHotkeys(
    "ctrl+k",
    (e) => {
      e.preventDefault();
      searchFocus.trigger();
    },
    { scopes: "trash" }
  );

  useHotkeys("p", () => navigation.openPrevFolder("first"), {
    scopes: ["trash", "viewer", "tag-editor"],
  });

  useHotkeys("n", () => navigation.openNextFolder("first"), {
    scopes: ["trash", "viewer", "tag-editor"],
  });

  useHotkeys("r", () => filtering.reset(), {
    scopes: ["trash"],
  });
}
