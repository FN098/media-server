import { createTagsAction, updateMediaTagsAction } from "@/actions/tag-actions";
import {
  EditingMode,
  TagEditMode,
} from "@/components/ui/sheets/tag-edit-sheet/types";
import { useTagEditorHotkeys } from "@/hooks/tag-editor/use-tag-editor-hotkeys";
import { MediaNode } from "@/lib/media/types";
import { TagOperation } from "@/lib/tag/types";
import { useTagEditorContext } from "@/providers/tag-editor-provider";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface UseTagEditSheetProps {
  open: boolean;
  targetNodes: MediaNode[];
  mode?: TagEditMode;
  opacity?: number; // 背景の不透明度 (0~100)
  onOpacityChange?: (opacity: number) => void;
  edit?: boolean;
  onClose: () => void;
  autoBlur?: boolean; // 編集モード切り替え時に自動で背景ブラーを有効化
}

export function useTagEditSheet({
  open,
  targetNodes,
  mode = "default",
  opacity: controlledOpacity,
  onOpacityChange: onControlledOpacityChange,
  edit,
  onClose,
  autoBlur = true,
}: UseTagEditSheetProps) {
  const router = useRouter();
  const editor = useTagEditorContext();

  const [isLoading, setIsLoading] = useState(false);

  const [internalOpacity, setInternalOpacity] = useState(editor.opacity);
  const opacity = controlledOpacity ?? internalOpacity;
  const setOpacity = onControlledOpacityChange ?? setInternalOpacity;

  const [editingMode, setEditingMode] = useState<EditingMode>(
    edit ? "edit" : "view"
  );

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

  // 不透明度
  const handleOpacityChange = useCallback(
    (opacity: number) => {
      setOpacity(opacity);
      editor.setOpacity(opacity);
    },
    [editor, setOpacity]
  );

  const toggleOpacity = () => handleOpacityChange(opacity === 0 ? 100 : 0);

  // 編集モード
  const handleModeChange = useCallback(
    (next: EditingMode) => {
      setEditingMode(next);
      if (autoBlur) {
        handleOpacityChange(next === "view" ? 0 : 100);
      }
    },
    [autoBlur, handleOpacityChange]
  );

  const resetEditingMode = () => handleModeChange("view");

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
  const handleApply = useCallback(async () => {
    if (isLoading || !editor.hasChanges) return;

    setIsLoading(true);

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

    setIsLoading(false);

    if (result.success) {
      toast.success("保存しました", { duration: 1000 });
      editor.resetChanges();

      await editor.invalidateTags();
      handleModeChange("view");

      router.refresh();
    }
  }, [editor, handleModeChange, isLoading, router, targetNodes]);

  // 閲覧→クイック→詳細モードに移行
  const handleModeChangeUp = () => {
    const modeMap = {
      view: "quick",
      quick: "edit",
      edit: "edit",
    } as const;

    const nextMode = modeMap[editingMode];
    handleModeChange(nextMode);
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
    handleModeChange(nextMode);
  };

  // 閉じる
  const handleClose = useCallback(() => {
    handleModeChange("view");
    onClose?.();
  }, [handleModeChange, onClose]);

  // ショートカット
  useTagEditorHotkeys({
    open,
    handleModeChangeDown,
    handleModeChange,
    toggleOpacity,
  });

  return {
    open,
    canEdit,
    editingMode,
    targetNodes,
    mode,
    opacity,
    editor,
    isLoading,
    resetEditingMode,
    handleClose,
    handleModeChangeDown,
    handleModeChangeUp,
    handleModeChange,
    handleOpacityChange,
    handleApply,
    handleNewAdd,
  };
}
