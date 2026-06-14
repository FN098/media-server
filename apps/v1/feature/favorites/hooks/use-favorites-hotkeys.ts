import { FavoritesDialogs } from "@/feature/favorites/hooks/use-favorites-dialogs";
import { FavoritesFiltering } from "@/feature/favorites/hooks/use-favorites-filtering";
import { Fullscreen } from "@/feature/general/hooks/use-fullscreen";
import { SearchFocus } from "@/feature/search/hooks/use-search-focus";
import { MediaNodeSelection } from "@/feature/selection/hooks/use-media-node-selection";
import { TagEditor } from "@/feature/tag-editor/hooks/use-tag-editor";
import { ViewerNavigation } from "@/feature/viewer/hooks/use-viewer-navigation";
import { useEffect, useMemo } from "react";
import { useHotkeys, useHotkeysContext } from "react-hotkeys-hook";

const ALL_SCOPES = ["favorites", "tag-editor", "viewer", "dialog"] as const;

interface UseFavoritesHotkeysProps {
  enabled: boolean;
  filtering: FavoritesFiltering;
  selection: MediaNodeSelection;
  dialogs: FavoritesDialogs;
  tagEditor: TagEditor;
  viewer: ViewerNavigation;
  fullscreen: Fullscreen;
  searchFocus: SearchFocus;
}

export function useFavoritesHotkeys({
  enabled,
  filtering,
  selection,
  dialogs,
  tagEditor,
  viewer,
  fullscreen,
  searchFocus,
}: UseFavoritesHotkeysProps) {
  // スコープ切り替えフック
  const { enableScope, disableScope } = useHotkeysContext();

  // 現在のスコープ
  const activeScope = useMemo<(typeof ALL_SCOPES)[number]>(() => {
    if (dialogs.isOpen) return "dialog";
    else if (tagEditor.isOpen) return "tag-editor";
    else if (viewer.isOpen) return "viewer";
    else return "favorites";
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
    scopes: "favorites",
    enabled,
  });

  useHotkeys("t", () => tagEditor.toggle(), {
    scopes: ["favorites", "viewer", "tag-editor"],
    enabled,
  });

  useHotkeys("f", () => void fullscreen.toggle(), {
    scopes: ["favorites", "viewer", "tag-editor"],
    enabled,
  });

  useHotkeys(
    "ctrl+a",
    (e) => {
      e.preventDefault();
      selection.selectAll();
    },
    {
      scopes: ["favorites", "tag-editor"],
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
      scopes: "favorites",
      enabled,
    }
  );

  useHotkeys("r", () => filtering.reset(), {
    scopes: ["favorites"],
    enabled: enabled && filtering.canReset,
  });
}
