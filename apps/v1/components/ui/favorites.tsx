"use client";

import { visitFolderAction } from "@/actions/folder-actions";
import { enqueueThumbJob } from "@/actions/thumb-actions";
import { ExplorerGridView } from "@/components/ui/explorer-grid-view";
import { ExplorerListView } from "@/components/ui/explorer-list-view";
import { MediaViewer } from "@/components/ui/media-viewer";
import { TagEditSheet } from "@/components/ui/tag-edit-sheet";
import {
  useExplorerQuery,
  useNormalizeExplorerQuery,
  useSetExplorerQuery,
} from "@/hooks/use-explorer-query";
import { useShortcutKeys } from "@/hooks/use-shortcut-keys";
import { MediaNode } from "@/lib/media/types";
import { ExplorerQuery } from "@/lib/query/types";
import { normalizeIndex } from "@/lib/query/utils";
import { useExplorerContext } from "@/providers/explorer-provider";
import { ScrollLockProvider } from "@/providers/scroll-lock-provider";
import { useSearchContext } from "@/providers/search-provider";
import { useTagEditorContext } from "@/providers/tag-editor-provider";
import { useViewModeContext } from "@/providers/view-mode-provider";
import { cn } from "@/shadcn/lib/utils";
import { useCallback, useEffect } from "react";
import { toast } from "sonner";

export function Favorites() {
  const {
    listing,
    searchFiltered,
    mediaOnly,
    selected,
    openNode,
    closeViewer,
    selectAllMedia,
    clearSelection,
  } = useExplorerContext();

  const {
    setTargetNodes: setTagEditTargetNodes,
    toggleEditorOpenClose: toggleTagEditorOpenClose,
    toggleIsTransparent: toggleTagEditorTransparent,
    openEditor: openTagEditor,
    closeEditor: closeTagEditor,
  } = useTagEditorContext();

  // 選択された項目をタグ編集の対象に指定
  useEffect(() => {
    setTagEditTargetNodes(selected);
    if (selected.length > 0) openTagEditor();
    else closeTagEditor();
  }, [closeTagEditor, openTagEditor, selected, setTagEditTargetNodes]);

  // クエリパラメータ
  const setExplorerQuery = useSetExplorerQuery();
  const { view, q, at, modal } = useExplorerQuery(); // URL
  const { focus: focusSearch, query, setQuery } = useSearchContext(); // ヘッダーUI
  const { viewMode, setViewMode } = useViewModeContext(); // ヘッダーUI
  const viewerIndex = at != null ? normalizeIndex(at, mediaOnly.length) : null;

  // 初期同期：URL → Context（1回だけ）
  useEffect(() => {
    if (view !== viewMode) setViewMode(view);
    if (q !== query) setQuery(q ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // UI操作：Context → URL
  useEffect(() => {
    const patch: Partial<ExplorerQuery> = {};

    // undefined と空文字列の比較にならないように normalize しておく
    const nq = q ?? "";
    const nQuery = query ?? "";

    if (view !== viewMode) patch.view = viewMode;
    if (nq !== nQuery) patch.q = nQuery || undefined;

    if (Object.keys(patch).length === 0) return;

    setExplorerQuery(patch);
  }, [q, query, setExplorerQuery, view, viewMode]);

  // クエリパラメータ正規化
  useNormalizeExplorerQuery();

  // サムネイル作成リクエスト送信
  useEffect(() => {
    void enqueueThumbJob(listing.path);
  }, [listing.path]);

  // 訪問済みフォルダ更新リクエスト送信
  useEffect(() => {
    void visitFolderAction(listing.path);
  }, [listing.path]);

  // ショートカット
  useShortcutKeys([
    { key: "t", callback: () => toggleTagEditorOpenClose() },
    { key: "x", callback: () => toggleTagEditorTransparent() },
    { key: "Ctrl+a", callback: () => selectAllMedia() },
    { key: "Ctrl+k", callback: () => focusSearch() },
    { key: "Escape", callback: () => clearSelection() },
  ]);

  // ショートカット beta
  // const { register: registerShortcuts } = useShortcutContext();
  // useEffect(() => {
  //   console.log("aaa");
  //   return registerShortcuts([
  //     { priority: 10, key: "t", callback: () => toggleTagEditorOpenClose() },
  //     { priority: 10, key: "x", callback: () => toggleTagEditorTransparent() },
  //     { priority: 10, key: "Ctrl+a", callback: () => selectAllMedia() },
  //     { priority: 10, key: "Ctrl+k", callback: () => focusSearch() },
  //     { priority: 10, key: "Escape", callback: () => clearSelection() },
  //   ]);
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  // ファイル/フォルダオープン
  const handleOpen = useCallback(
    (node: MediaNode) => {
      const result = openNode(node);

      if (result === "unsupported") {
        toast.warning("このファイル形式は対応していません");
      }
    },
    [openNode]
  );

  return (
    <div
      className={cn(
        "flex-1 overflow-auto",
        view === "grid" && "p-4",
        view === "list" && "px-4"
      )}
    >
      {/* グリッドビュー */}
      {view === "grid" && (
        <div>
          <ExplorerGridView nodes={searchFiltered} onOpen={handleOpen} />
        </div>
      )}

      {/* リストビュー */}
      {view === "list" && (
        <div>
          <ExplorerListView nodes={searchFiltered} onOpen={handleOpen} />
        </div>
      )}

      {/* タグエディター */}
      <TagEditSheet />

      {/* ビューワ */}
      {modal && viewerIndex != null && (
        <ScrollLockProvider>
          <MediaViewer
            items={mediaOnly}
            initialIndex={viewerIndex}
            features={{ openFolder: true }}
            onClose={closeViewer}
          />
        </ScrollLockProvider>
      )}
    </div>
  );
}
