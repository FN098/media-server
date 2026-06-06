import { SheetFooter } from "@/components/ui/sheets/tag-edit-sheet/seet-footer";
import { SheetHeader } from "@/components/ui/sheets/tag-edit-sheet/seet-header";
import { TagInput } from "@/components/ui/sheets/tag-edit-sheet/tag-input";
import { TagList } from "@/components/ui/sheets/tag-edit-sheet/tag-list";
import {
  EditingMode,
  TagEditMode,
} from "@/components/ui/sheets/tag-edit-sheet/types";
import { useDetectMobile } from "@/hooks/general/use-mobile";
import { MediaNode } from "@/lib/media/types";
import { createTagsAction, updateMediaTagsAction } from "@/lib/tag/actions";
import { TagOperation } from "@/lib/tag/types";
import { useTagEditorContext } from "@/providers/tag-editor-provider";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shadcn/components/ui/tabs";
import { cn } from "@/shadcn/lib/utils";
import { AnimatePresence, motion, useDragControls } from "framer-motion";
import { Clock, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { toast } from "sonner";

interface TagEditSheetProps {
  open: boolean;
  targetNodes: MediaNode[];
  mode?: TagEditMode;
  opacity?: number; // 背景の不透明度 (0~100)
  onOpacityChange?: (opacity: number) => void;
  edit?: boolean;
  onClose: () => void;
  autoBlur?: boolean; // 編集モード切り替え時に自動で背景ブラーを有効化
}

export function TagEditSheet({
  open,
  targetNodes,
  mode = "default",
  opacity: controlledOpacity,
  onOpacityChange: onControlledOpacityChange,
  edit,
  onClose,
  autoBlur = true,
}: TagEditSheetProps) {
  const router = useRouter();
  const editor = useTagEditorContext();
  const controls = useDragControls();
  const isMobile = useDetectMobile();
  const canEdit = mode !== "none" && targetNodes.length > 0;

  // オープン時にアクティブ化
  useEffect(() => {
    if (open) {
      editor.activate();
    }
  }, [editor, open]);

  // 対象が変更されたらコンテキストに反映
  useEffect(() => {
    editor.setTargetNodes(targetNodes);
  }, [editor, targetNodes]);

  // 編集モード
  const [editingMode, setEditingMode] = useState<EditingMode>(
    edit ? "edit" : "view"
  );
  const handleEditingModeChange = (next: EditingMode) => {
    setEditingMode(next);
    if (autoBlur) {
      handleOpacityChange(next === "view" ? 0 : 100);
    }
  };
  const resetEditingMode = () => handleEditingModeChange("view");

  // 不透明度
  const [internalOpacity, setInternalOpacity] = useState(editor.opacity);
  const opacity = controlledOpacity ?? internalOpacity;
  const setOpacity = onControlledOpacityChange ?? setInternalOpacity;
  const handleOpacityChange = (opacity: number) => {
    setOpacity(opacity);
    editor.setOpacity(opacity);
  };
  const toggleOpacity = () => handleOpacityChange(opacity === 0 ? 100 : 0);

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

      const tagsToCreate = editor.pendingNewTags
        .filter((t) => editor.pendingChanges[t.id] !== "remove")
        .map((t) => t.name);

      // 仮タグを DB 作成
      const created = await createTagsAction(tagsToCreate);
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
        handleEditingModeChange("view");

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
    handleEditingModeChange(nextMode);
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
    handleEditingModeChange(nextMode);
  };

  // 閉じる
  const handleClose = () => {
    handleEditingModeChange("view");
    onClose?.();
  };

  // ===== ショートカット =====

  // Escape / Backspace: 閉じる
  useHotkeys(["escape", "backspace"], () => handleModeChangeDown(), {
    scopes: "tag-editor",
    enabled: open,
  });

  // E: 詳細モード
  useHotkeys("e", () => handleEditingModeChange("edit"), {
    scopes: "tag-editor",
    enabled: open,
  });

  // Q: クイックモード
  useHotkeys("q", () => handleEditingModeChange("quick"), {
    scopes: "tag-editor",
    enabled: open,
  });

  // V: 閲覧モード
  useHotkeys("v", () => handleEditingModeChange("view"), {
    scopes: "tag-editor",
    enabled: open,
  });

  // B: 不透明度トグル
  useHotkeys("b", () => toggleOpacity(), {
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
                        onModeChange={handleEditingModeChange}
                        opacity={opacity}
                        canEdit={canEdit}
                        onClose={handleClose}
                        onEditClick={handleModeChangeUp}
                        onOpacityChange={handleOpacityChange}
                      />
                      <TagList
                        isEditing={false}
                        tags={editor.relatedTags}
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
                        onModeChange={handleEditingModeChange}
                        opacity={opacity}
                        canEdit={canEdit}
                        onClose={handleClose}
                        onEditClick={handleModeChangeUp}
                        onOpacityChange={handleOpacityChange}
                      />
                      <TagList
                        isEditing={true}
                        tags={editor.relatedTags}
                        pendingChanges={editor.pendingChanges}
                        pendingNewTags={editor.pendingNewTags}
                        tagStates={editor.tagStates}
                        onToggle={editor.toggleTagChange}
                        opacity={opacity}
                      />
                      <Tabs defaultValue="recent" className="w-full">
                        <TabsList className="w-full h-10">
                          <TabsTrigger value="recent" className="gap-2">
                            <Clock className="size-3.5" />
                            最近使用
                          </TabsTrigger>
                          <TabsTrigger value="favorite" className="gap-2">
                            <Star className="size-3.5" />
                            お気に入り
                          </TabsTrigger>
                        </TabsList>

                        <div className="mt-2 min-h-[150px] max-h-[150px] overflow-auto">
                          <TabsContent
                            value="recent"
                            className="mt-0 outline-none"
                          >
                            <TagList
                              isEditing={true}
                              tags={editor.recentTags}
                              pendingChanges={editor.pendingChanges}
                              pendingNewTags={editor.pendingNewTags}
                              tagStates={editor.tagStates}
                              onToggle={editor.toggleTagChange}
                              opacity={opacity}
                            />
                          </TabsContent>
                          <TabsContent
                            value="favorite"
                            className="mt-0 outline-none"
                          >
                            <TagList
                              isEditing={true}
                              tags={editor.favoriteTags}
                              pendingChanges={editor.pendingChanges}
                              pendingNewTags={editor.pendingNewTags}
                              tagStates={editor.tagStates}
                              onToggle={editor.toggleTagChange}
                              opacity={opacity}
                            />
                          </TabsContent>
                        </div>
                      </Tabs>
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
                        onModeChange={handleEditingModeChange}
                        opacity={opacity}
                        canEdit={canEdit}
                        onEditClick={() => {}}
                        onClose={handleClose}
                        onOpacityChange={handleOpacityChange}
                      />
                      <TagInput
                        value={editor.newTagName}
                        opacity={opacity}
                        disabled={isLoading}
                        autoFocus={!isMobile}
                        autoBlur={isMobile}
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
