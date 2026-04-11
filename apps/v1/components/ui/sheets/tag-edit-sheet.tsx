import { createTagsAction, updateMediaTagsAction } from "@/actions/tag-actions";
import { FavoriteTagPanel } from "@/components/ui/sheets/tag-edit-sheet/favorite-tag-panel";
import { RecentTagPanel } from "@/components/ui/sheets/tag-edit-sheet/recent-tag-panel";
import { SheetFooter } from "@/components/ui/sheets/tag-edit-sheet/seet-footer";
import { SheetHeader } from "@/components/ui/sheets/tag-edit-sheet/seet-header";
import { TagInput } from "@/components/ui/sheets/tag-edit-sheet/tag-input";
import { TagList } from "@/components/ui/sheets/tag-edit-sheet/tag-list";
import {
  EditingMode,
  TagEditMode,
} from "@/components/ui/sheets/tag-edit-sheet/types";
import { MediaNode } from "@/lib/media/types";
import { TagOperation } from "@/lib/tag/types";
import { useTagEditorContext } from "@/providers/tag-editor-provider";
import { useIsMobile } from "@/shadcn/hooks/use-mobile";
import { cn } from "@/shadcn/lib/utils";
import { AnimatePresence, motion, useDragControls } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { toast } from "sonner";

interface TagEditSheetProps {
  open: boolean;
  targetNodes: MediaNode[];
  mode?: TagEditMode;
  opacity?: number;
  edit?: boolean;
  onClose: () => void;
}

export function TagEditSheet({
  open,
  targetNodes,
  mode = "default",
  opacity: initialOpacity,
  edit,
  onClose,
}: TagEditSheetProps) {
  const router = useRouter();
  const editor = useTagEditorContext();
  const controls = useDragControls();
  const isMobile = useIsMobile();
  const canEdit = mode !== "none" && targetNodes.length > 0;

  // 対象が変更されたらコンテキストに反映
  useEffect(() => {
    editor.setTargetNodes(targetNodes);
  }, [editor, targetNodes]);

  // 編集モード
  const [editingMode, setEditingMode] = useState<EditingMode>(
    edit ? "edit" : "view"
  );
  const resetEditingMode = () => setEditingMode("view");

  // 透明モード
  const [opacity, setOpacity] = useState(initialOpacity ?? editor.opacity);
  const handleChangeOpacity = (opacity: number) => {
    setOpacity(opacity);
    editor.setOpacity(opacity);
  };

  // 新規作成
  const handleNewAdd = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    // 既に存在すれば「追加候補」
    const existing = editor.editModeTags.find((t) => t.name === trimmed);
    if (existing) {
      editor.setTagChange(existing, "add");
      editor.setNewTagName("");
      return;
    }

    // 存在しない場合は仮タグとしてメモリに積む
    editor.addPendingNewTag(trimmed);
    editor.setNewTagName("");
  };

  // 保存処理
  const [isLoading, startTransition] = useTransition();
  const handleApply = () => {
    startTransition(async () => {
      if (isLoading || !editor.hasChanges) return;

      // 仮タグを DB 作成
      const created = await createTagsAction(
        editor.pendingNewTags.map((t) => t.name)
      );
      if (!created.success) throw new Error(created.error);

      // 新規タグの操作
      const createdOps: TagOperation[] = created.tags.map((tag) => ({
        tagId: tag.id,
        operator: "add",
      }));

      // 既存タグの操作
      const existingOps: TagOperation[] = Object.entries(
        editor.pendingChanges
      ).map(([tagId, operator]) => ({
        tagId,
        operator,
      }));

      // マージ
      const operations = [...existingOps, ...createdOps];
      if (operations.length === 0) return;

      // 紐づけ実行
      const result = await updateMediaTagsAction({
        mediaPaths: targetNodes.map((n) => n.path),
        operations,
      });

      if (result.success) {
        toast.success("保存しました", { duration: 1000 });
        editor.resetChanges();

        await editor.invalidateTags();
        setEditingMode("view");

        router.refresh();
      }
    });
  };

  // 閲覧→クイック→詳細モードに移行
  const handleModeChangeUp = () => {
    const modeMap = {
      view: "quick",
      quick: "edit",
      edit: "edit",
    } as const;

    const nextMode = modeMap[editingMode];
    setEditingMode(nextMode);
  };

  // 詳細→クイック→閲覧モードに移行 or 閉じる
  const handleModeChangeDown = () => {
    const modeMap = {
      edit: "quick",
      quick: "view",
      view: "close",
    } as const;

    const nextMode = modeMap[editingMode];
    if (nextMode === "close") {
      handleClose();
      return;
    }
    setEditingMode(nextMode);
  };

  // 閉じる
  const handleClose = () => {
    setEditingMode("view");
    onClose?.();
  };

  // ショートカット
  useHotkeys("escape", () => handleModeChangeDown(), {
    scopes: "tag-editor",
    enabled: open,
  });
  useHotkeys("e", () => setEditingMode("edit"), {
    scopes: "tag-editor",
    enabled: open,
  });
  useHotkeys("q", () => setEditingMode("quick"), {
    scopes: "tag-editor",
    enabled: open,
  });
  useHotkeys("v", () => setEditingMode("view"), {
    scopes: "tag-editor",
    enabled: open,
  });

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* 暗転オーバーレイ */}
          {(editingMode === "edit" || editingMode === "quick") && (
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/40"
              onClick={resetEditingMode}
            />
          )}

          {/* メインコンテナ */}
          <motion.div
            key="main-sheet"
            layout
            drag="y"
            dragControls={controls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              // 下スワイプ: 終了
              if (info.velocity.y > 300 || info.offset.y > 100) {
                handleModeChangeDown();
              }
              // 上スワイプ: 編集
              else if (info.velocity.y < -300 || info.offset.y < -100) {
                if (canEdit) {
                  handleModeChangeUp();
                }
              }
            }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={cn(
              "fixed bottom-0 left-1/2 -translate-x-1/2 z-[70]",
              "w-full max-w-md",
              "pointer-events-auto select-none",
              "rounded-t-[24px] pb-safe overflow-visible"
            )}
          >
            {/* 背景レイヤー */}
            <div
              className="absolute inset-0 -bottom-[300px] -z-10 rounded-t-[24px] bg-background border border-b-0 border-border"
              style={{
                backgroundColor: `color-mix(in oklch, var(--background), transparent)`,
                backdropFilter:
                  opacity > 0 ? `blur(${opacity / 10}px)` : "none",
              }}
            />

            <div className="relative rounded-t-[24px] pb-safe">
              {/* ハンドル（つまみ） */}
              <div
                className="w-full pt-4 pb-2 cursor-grab active:cursor-grabbing touch-none"
                onPointerDown={(e) => controls.start(e)}
              >
                <div
                  className={cn("w-12 h-1.5 bg-muted/40 rounded-full mx-auto")}
                />
              </div>

              {/* コンテンツエリア */}
              <div className="px-4 pb-6 overflow-y-auto max-h-[85vh]">
                <AnimatePresence mode="wait">
                  {/* 閲覧モード */}
                  {editingMode === "view" && (
                    <motion.div
                      key="view-mode-panel"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="space-y-4"
                    >
                      <SheetHeader
                        mode={mode}
                        count={targetNodes.length}
                        editingMode={editingMode}
                        setEditingMode={setEditingMode}
                        opacity={opacity}
                        canEdit={canEdit}
                        onClose={handleClose}
                        onEditClick={handleModeChangeUp}
                        onOpacityChange={handleChangeOpacity}
                      />
                      <TagList
                        isEditing={false}
                        tags={editor.viewModeTags}
                        pendingChanges={editor.pendingChanges}
                        pendingNewTags={editor.pendingNewTags}
                        tagStates={editor.tagStates}
                        onToggle={editor.toggleTagChange}
                        opacity={opacity}
                      />
                    </motion.div>
                  )}

                  {/* クイックモード */}
                  {editingMode === "quick" && (
                    <motion.div
                      key="quick-mode-panel"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="space-y-4"
                    >
                      <SheetHeader
                        mode={mode}
                        count={targetNodes.length}
                        editingMode={editingMode}
                        setEditingMode={setEditingMode}
                        opacity={opacity}
                        canEdit={canEdit}
                        onClose={handleClose}
                        onEditClick={handleModeChangeUp}
                        onOpacityChange={handleChangeOpacity}
                      />
                      <TagList
                        isEditing={true}
                        tags={editor.viewModeTags}
                        pendingChanges={editor.pendingChanges}
                        pendingNewTags={editor.pendingNewTags}
                        tagStates={editor.tagStates}
                        onToggle={editor.toggleTagChange}
                        opacity={opacity}
                      />
                      <RecentTagPanel
                        recentTags={editor.recentTags}
                        tagStates={editor.tagStates}
                        pendingChanges={editor.pendingChanges}
                        onToggle={editor.toggleTagChange}
                        opacity={opacity}
                      />
                      <FavoriteTagPanel
                        favoriteTags={editor.favoriteTags}
                        tagStates={editor.tagStates}
                        pendingChanges={editor.pendingChanges}
                        onToggle={editor.toggleTagChange}
                        opacity={opacity}
                      />
                      <SheetFooter
                        onReset={editor.resetChanges}
                        onApply={handleApply}
                        hasChanges={editor.hasChanges}
                        isLoading={isLoading}
                        opacity={opacity}
                      />
                    </motion.div>
                  )}

                  {/* 詳細モード */}
                  {editingMode === "edit" && (
                    <motion.div
                      key="edit-mode-panel"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="space-y-4"
                    >
                      <SheetHeader
                        mode={mode}
                        count={targetNodes.length}
                        editingMode={editingMode}
                        setEditingMode={setEditingMode}
                        opacity={opacity}
                        canEdit={canEdit}
                        onEditClick={() => {}}
                        onClose={handleClose}
                        onOpacityChange={handleChangeOpacity}
                      />
                      <TagInput
                        value={editor.newTagName}
                        opacity={opacity}
                        disabled={isLoading}
                        autoFocus={isMobile ? false : true}
                        suggestions={editor.suggestedTags}
                        onChange={editor.setNewTagName}
                        onAdd={() => handleNewAdd(editor.newTagName)}
                        onSelectSuggestion={editor.selectSuggestion}
                        onApply={handleApply}
                        onCancel={resetEditingMode}
                      />
                      <TagList
                        isEditing={true}
                        tags={editor.editModeTags}
                        pendingChanges={editor.pendingChanges}
                        pendingNewTags={editor.pendingNewTags}
                        tagStates={editor.tagStates}
                        onToggle={editor.toggleTagChange}
                        opacity={opacity}
                      />
                      <SheetFooter
                        onReset={editor.resetChanges}
                        onApply={handleApply}
                        hasChanges={editor.hasChanges}
                        isLoading={isLoading}
                        opacity={opacity}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
