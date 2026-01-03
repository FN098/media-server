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
import { MediaNode } from "@/lib/media/types";
import { getClientExplorerPath } from "@/lib/path/helpers";
import { ExplorerQuery } from "@/lib/query/types";
import { normalizeIndex } from "@/lib/query/utils";
import { KeyAction } from "@/lib/shortcut/types";
import { useExplorerContext } from "@/providers/explorer-provider";
import { ScrollLockProvider } from "@/providers/scroll-lock-provider";
import { useSearchContext } from "@/providers/search-provider";
import { useShortcutContext } from "@/providers/shortcut-provider";
import { useTagEditorContext } from "@/providers/tag-editor-provider";
import { useViewModeContext } from "@/providers/view-mode-provider";
import { Button } from "@/shadcn/components/ui/button";
import { cn } from "@/shadcn/lib/utils";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect } from "react";
import { toast } from "sonner";

export function Explorer() {
  const {
    listing,
    searchFiltered,
    mediaOnly,
    selected,
    openNode,
    closeViewer,
    openNextFolder,
    openPrevFolder,
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
  const { register: registerShortcuts } = useShortcutContext();
  useEffect(() => {
    const partial: Partial<KeyAction> = { priority: 10 };
    return registerShortcuts([
      { ...partial, key: "q", callback: () => openPrevFolder("first") },
      { ...partial, key: "e", callback: () => openNextFolder("first") },
      { ...partial, key: "t", callback: () => toggleTagEditorOpenClose() },
      { ...partial, key: "x", callback: () => toggleTagEditorTransparent() },
      { ...partial, key: "Ctrl+a", callback: () => selectAllMedia() },
      { ...partial, key: "Ctrl+k", callback: () => focusSearch() },
      { ...partial, key: "Escape", callback: () => clearSelection() },
    ]);
  }, [
    clearSelection,
    focusSearch,
    openNextFolder,
    openPrevFolder,
    registerShortcuts,
    selectAllMedia,
    toggleTagEditorOpenClose,
    toggleTagEditorTransparent,
  ]);

  // ショートカット
  // useShortcutKeys([
  //   { key: "q", callback: () => openPrevFolder("first") },
  //   { key: "e", callback: () => openNextFolder("first") },
  //   { key: "t", callback: () => toggleTagEditorOpenClose() },
  //   { key: "x", callback: () => toggleTagEditorTransparent() },
  //   { key: "Ctrl+a", callback: () => selectAllMedia() },
  //   { key: "Ctrl+k", callback: () => focusSearch() },
  //   { key: "Escape", callback: () => clearSelection() },
  // ]);

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
        viewMode === "grid" && "p-4",
        viewMode === "list" && "px-4"
      )}
    >
      {/* グリッドビュー */}
      {viewMode === "grid" && (
        <div>
          <ExplorerGridView nodes={searchFiltered} onOpen={handleOpen} />
        </div>
      )}

      {/* リストビュー */}
      {viewMode === "list" && (
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
            onClose={closeViewer}
            onPrevFolder={() => openPrevFolder("last")}
            onNextFolder={() => openNextFolder("first")}
          />
        </ScrollLockProvider>
      )}

      {/* フォルダナビゲーション */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-8 border-t border-border/30">
        {/* 前のフォルダ */}
        <div className="w-full sm:flex-1">
          {listing.prev && (
            <Button
              variant="outline"
              className="group flex flex-col items-start gap-1 h-auto py-4 px-6 w-full sm:max-w-[280px] hover:bg-accent transition-all"
              asChild
            >
              <Link href={encodeURI(getClientExplorerPath(listing.prev))}>
                <div className="flex items-center text-xs text-muted-foreground group-hover:text-primary">
                  <ArrowLeft className="mr-1 h-3 w-3" />
                  Previous
                </div>
                <div className="text-base font-medium truncate w-full text-left">
                  {listing.prev.split("/").filter(Boolean).pop()}
                </div>
              </Link>
            </Button>
          )}
        </div>

        {/* 次のフォルダ */}
        <div className="w-full sm:flex-1 flex justify-end">
          {listing.next && (
            <Button
              variant="outline"
              className="group flex flex-col items-end gap-1 h-auto py-4 px-6 w-full sm:max-w-[280px] hover:bg-accent transition-all"
              asChild
            >
              <Link href={encodeURI(getClientExplorerPath(listing.next))}>
                <div className="flex items-center text-xs text-muted-foreground group-hover:text-primary">
                  Next
                  <ArrowRight className="ml-1 h-3 w-3" />
                </div>
                <div className="text-base font-medium truncate w-full text-right">
                  {listing.next.split("/").filter(Boolean).pop()}
                </div>
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
