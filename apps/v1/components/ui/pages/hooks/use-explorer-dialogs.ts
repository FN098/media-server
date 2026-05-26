import { MediaNode } from "@/lib/media/types";
import { dirname } from "path";
import { useCallback, useState } from "react";

type DialogType =
  | "extract"
  | "rename"
  | "create-folder"
  | "move"
  | "copy"
  | "delete"
  | "preview";

type DialogCloseContext = {
  dialog: DialogType;
};

type UseExplorerDialogsProps = {
  currentDirPath: string;
  selectedNodes: MediaNode[];
  onClose: (context: DialogCloseContext) => void;
};

export function useExplorerDialogs({
  currentDirPath,
  selectedNodes,
  onClose,
}: UseExplorerDialogsProps) {
  // ===== 解凍 =====

  const [extractTargets, setExtractTargets] = useState<MediaNode[]>([]);
  const isExtractMode = !!extractTargets && extractTargets.length > 0;

  const handleOpenExtractDialogSingle = useCallback((node: MediaNode) => {
    setExtractTargets([node]);
  }, []);

  const handleOpenExtractDialogSelected = useCallback(() => {
    setExtractTargets(selectedNodes);
  }, [selectedNodes]);

  const handleExtractDialogOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        setExtractTargets([]);
        onClose({ dialog: "extract" });
      }
    },
    [onClose]
  );

  // ===== リネーム =====

  const [renameTarget, setRenameTarget] = useState<MediaNode | null>(null);
  const isRenameMode = !!renameTarget;

  const handleOpenRenameDialog = (node: MediaNode) => {
    setRenameTarget(node);
  };

  const handleRenameDialogOpenChange = (open: boolean) => {
    if (!open) {
      setRenameTarget(null);
      onClose({ dialog: "rename" });
    }
  };

  // ===== フォルダ作成 =====

  const [folderPath, setFolderPath] = useState<string | null>(null);
  const isCreateFolderMode = !!folderPath;

  const handleOpenCreateFolderDialog = () => {
    setFolderPath(currentDirPath);
  };

  const handleCreateFolderDialogOpenChange = (open: boolean) => {
    if (!open) {
      setFolderPath(null);
      onClose({ dialog: "create-folder" });
    }
  };

  // ===== 移動 =====

  const [moveTargets, setMoveTargets] = useState<MediaNode[]>([]);
  const isMoveMode = moveTargets.length > 0;
  const initialMoveDialogDirPath =
    moveTargets.length > 0 ? dirname(moveTargets[0]?.path) : undefined;

  const handleOpenMoveDialogSingle = (node: MediaNode) => {
    setMoveTargets([node]);
  };

  const handleOpenMoveDialogSelected = () => {
    setMoveTargets(selectedNodes);
  };

  const handleMoveDialogOpenChange = (open: boolean) => {
    if (!open) {
      setMoveTargets([]);
      onClose({ dialog: "move" });
    }
  };

  // ===== コピー =====

  const [copyTargets, setCopyTargets] = useState<MediaNode[]>([]);
  const isCopyMode = copyTargets.length > 0;
  const initialCopyDialogDirPath =
    copyTargets.length > 0 ? dirname(copyTargets[0]?.path) : undefined;

  const handleOpenCopyDialogSingle = (node: MediaNode) => {
    setCopyTargets([node]);
  };
  const handleOpenCopyDialogSelected = () => {
    setCopyTargets(selectedNodes);
  };

  const handleCopyDialogOpenChange = (open: boolean) => {
    if (!open) {
      setCopyTargets([]);
      onClose({ dialog: "copy" });
    }
  };

  // ===== 削除 =====

  const [deleteTargets, setDeleteTargets] = useState<MediaNode[]>([]);
  const isDeleteMode = deleteTargets.length > 0;

  // 削除ダイアログを開く（単体）
  const handleOpenDeleteDialogSingle = (node: MediaNode) => {
    setDeleteTargets([node]);
  };

  // 削除ダイアログを開く（選択）
  const handleOpenDeleteDialogSelected = () => {
    setDeleteTargets(selectedNodes);
  };

  // 後始末
  const handleDeleteDialogOpenChange = (open: boolean) => {
    if (!open) {
      setDeleteTargets([]);
      onClose({ dialog: "delete" });
    }
  };

  // ===== プレビュー設定 =====

  const [previewPath, setPreviewPath] = useState<string | null>(null);
  const isFolderPreviewMode = previewPath != null;

  const handleOpenApplyPreviewDialog = (node: MediaNode) => {
    setPreviewPath(node.path);
  };

  const handleApplyPreviewDialogOpenChange = (open: boolean) => {
    if (!open) {
      setPreviewPath(null);
      onClose({ dialog: "preview" });
    }
  };

  return {
    extractTargets,
    setExtractTargets,
    isExtractMode,
    handleOpenExtractDialogSingle,
    handleOpenExtractDialogSelected,
    handleExtractDialogOpenChange,

    renameTarget,
    setRenameTarget,
    isRenameMode,
    handleOpenRenameDialog,
    handleRenameDialogOpenChange,

    folderPath,
    setFolderPath,
    isCreateFolderMode,
    handleOpenCreateFolderDialog,
    handleCreateFolderDialogOpenChange,

    moveTargets,
    setMoveTargets,
    isMoveMode,
    initialMoveDialogDirPath,
    handleOpenMoveDialogSingle,
    handleOpenMoveDialogSelected,
    handleMoveDialogOpenChange,

    copyTargets,
    setCopyTargets,
    isCopyMode,
    initialCopyDialogDirPath,
    handleOpenCopyDialogSingle,
    handleOpenCopyDialogSelected,
    handleCopyDialogOpenChange,

    deleteTargets,
    setDeleteTargets,
    isDeleteMode,
    handleOpenDeleteDialogSingle,
    handleOpenDeleteDialogSelected,
    handleDeleteDialogOpenChange,

    previewPath,
    setPreviewPath,
    isFolderPreviewMode,
    handleOpenApplyPreviewDialog,
    handleApplyPreviewDialogOpenChange,
  };
}
