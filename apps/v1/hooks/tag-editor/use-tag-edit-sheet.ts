import { updateManyMediaTagsAction } from "@/actions/media-tag/update-many";
import { createTagsAction } from "@/actions/tag/create";
import { TagEditor } from "@/hooks/tag-editor/use-tag-editor";
import { useTagEditorHotkeys } from "@/hooks/tag-editor/use-tag-editor-hotkeys";
import { MediaNode } from "@/lib/media/types";
import { EditingMode } from "@/lib/tag-editor/types";
import { TagOperation } from "@/lib/tag/types";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const initialEditingMode: EditingMode = "view";

export interface UseTagEditSheetProps {
  tagEditor: TagEditor;
  targetNodes: MediaNode[];
  mode?: EditingMode;
  onModeChange?: (mode: EditingMode) => void;
  autoBlur?: boolean; // 編集モード切り替え時に自動で背景ブラーを有効化
}

export function useTagEditSheet({
  tagEditor,
  targetNodes,
  mode: controlledMode,
  onModeChange: onControlledModeChange,
  autoBlur = true,
}: UseTagEditSheetProps) {
  const {
    isOpen,
    activate,
    opacity,
    setOpacity,
    pendingNewTags,
    pendingChanges,
    setTagChange,
    setNewTagName,
    addPendingNewTag,
    hasChanges,
    editModeTags,
    resetChanges,
    invalidateTags,
    close,
    setTargetNodes,
  } = tagEditor;

  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);

  const [internalEditingMode, setInternalEditingMode] =
    useState<EditingMode>(initialEditingMode);
  const editingMode = controlledMode ?? internalEditingMode;
  const setEditingMode = onControlledModeChange ?? setInternalEditingMode;

  const canEdit = targetNodes.length > 0;

  // オープン時にアクティブ化
  useEffect(() => {
    if (isOpen) {
      activate();
    }
  }, [activate, isOpen]);

  // 対象が変更されたらコンテキストに反映
  useEffect(() => {
    setTargetNodes(targetNodes);
  }, [setTargetNodes, targetNodes]);

  // 不透明度変更
  const handleOpacityChange = useCallback(
    (opacity: number) => {
      setOpacity(opacity);
      setOpacity(opacity);
    },
    [setOpacity]
  );

  // 不透明度トグル
  const toggleOpacity = useCallback(
    () => handleOpacityChange(opacity === 0 ? 100 : 0),
    [handleOpacityChange, opacity]
  );

  // 編集モード切り替え
  const handleModeChange = useCallback(
    (next: EditingMode) => {
      setEditingMode(next);
      if (autoBlur) {
        handleOpacityChange(next === "view" ? 0 : 100);
      }
    },
    [autoBlur, handleOpacityChange, setEditingMode]
  );

  // リセット
  const handleReset = useCallback(() => {
    resetChanges();
    handleModeChange(initialEditingMode);
  }, [handleModeChange, resetChanges]);

  // 新規追加
  const handleNewAdd = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;

      // 既に存在すれば「追加候補」
      const existing = editModeTags.find((t) => t.name === trimmed);
      if (existing) {
        setTagChange(existing, "add");
        setNewTagName("");
        return;
      }

      // 存在しない場合は仮タグとしてメモリに積む
      addPendingNewTag(trimmed);
      setNewTagName("");
    },
    [addPendingNewTag, editModeTags, setNewTagName, setTagChange]
  );

  // 保存処理
  const handleApply = useCallback(async () => {
    if (!hasChanges) return;

    setIsLoading(true);
    try {
      const tagsToCreate = pendingNewTags
        .filter((t) => pendingChanges[t.id] === "add")
        .map((t) => t.name);

      let createdOps: TagOperation[] = [];
      if (tagsToCreate.length > 0) {
        // 仮タグを DB 作成
        const created = await createTagsAction({ names: tagsToCreate });
        if (!created.success) throw new Error(created.message);

        // 新規タグの操作
        createdOps = created.tags.map((tag) => ({
          tagId: tag.id,
          operator: "add",
        }));
      }

      // 既存タグの操作
      const existingOps: TagOperation[] = Object.entries(pendingChanges).map(
        ([tagId, operator]) => ({
          tagId,
          operator,
        })
      );

      // マージ
      const operations = [...existingOps, ...createdOps];
      if (operations.length === 0) return;

      // 紐づけ実行
      const result = await updateManyMediaTagsAction({
        mediaPaths: targetNodes.map((n) => n.path),
        operations,
      });

      if (result.success) {
        toast.success("保存しました", { duration: 1000 });
        resetChanges();

        await invalidateTags();
        handleModeChange("view");

        router.refresh();
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    hasChanges,
    pendingNewTags,
    pendingChanges,
    targetNodes,
    resetChanges,
    invalidateTags,
    handleModeChange,
    router,
  ]);

  // 閉じる
  const handleClose = useCallback(() => {
    handleModeChange("view");
    close();
  }, [close, handleModeChange]);

  // モードチェンジ↑：閲覧→クイック→詳細
  const handleModeChangeUp = useCallback(() => {
    const modeMap = {
      view: "quick",
      quick: "edit",
      edit: "edit",
    } as const;

    const nextMode = modeMap[editingMode];

    handleModeChange(nextMode);
  }, [editingMode, handleModeChange]);

  // モードチェンジ↓：詳細→クイック→閲覧→閉じる
  const handleModeChangeDown = useCallback(() => {
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
  }, [editingMode, handleClose, handleModeChange]);

  // ショートカット
  useTagEditorHotkeys({
    isOpen,
    handleModeChangeDown,
    handleModeChange,
    toggleOpacity,
  });

  return {
    isOpen,
    canEdit,
    editingMode,
    targetNodes,
    opacity,
    tagEditor,
    isLoading,
    hasChanges,
    handleClose,
    handleModeChangeDown,
    handleModeChangeUp,
    handleModeChange,
    handleOpacityChange,
    handleApply,
    handleNewAdd,
    handleReset,
  };
}
