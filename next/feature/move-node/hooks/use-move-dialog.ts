import { togglePinVisitedFolderAction } from "@/__feature/folder/actions/toggle-pin-visited";
import { getParentFolderAction } from "@/feature/move-node/actions/get-parent-folder";
import { moveManyNodesAction } from "@/feature/move-node/actions/move-many-nodes";
import { listRecentFoldersAction } from "@/feature/recent-folders/actions/list-recent-folders";
import { RecentFolder } from "@/feature/recent-folders/lib/types";
import { listSubFoldersAction } from "@/feature/sub-folders/actions/list-sub-folders";
import { refreshSubFoldersAction } from "@/feature/sub-folders/actions/refresh-sub-folders";
import { useCallback, useState } from "react";
import { toast } from "sonner";

type Folder = {
  id: string;
  name: string;
  parentFolderId: string | null;
};

type Node = {
  id: string;
  name: string;
  isDirectory: boolean;
};

interface UseMoveDialogProps {
  onSuccess?: () => void;
}

export function useMoveDialog({ onSuccess }: UseMoveDialogProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialFolder, setInitialFolder] = useState<Folder>();
  const [currentFolder, setCurrentFolder] = useState<Folder>();
  const [subFolders, setSubFolders] = useState<Folder[]>([]);
  const [recentDirs, setRecentDirs] = useState<RecentFolder[]>([]);
  const [targets, setTargets] = useState<Node[]>([]);
  const [isPending, setIsPending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // フォルダ一覧更新
  const refreshSubFolders = useCallback(async (parentFolderId: string) => {
    setIsLoading(true);
    try {
      const result = await refreshSubFoldersAction({ parentFolderId });
      if (!result.success) {
        toast.error(result.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 通常のフォルダ一覧取得
  const getSubFolders = useCallback(
    async (parentFolderId: string) => {
      setIsLoading(true);
      try {
        const result = await listSubFoldersAction({ parentFolderId });
        if (result.success) {
          const folderIds = new Set(
            targets.filter((t) => t.isDirectory).map((t) => t.id)
          );
          // ループ防止のフィルタリング
          const filtered = result.folders.filter((f) => !folderIds.has(f.id));
          setSubFolders(
            filtered.map((f) => ({
              ...f,
              parentFolderId,
            }))
          );
        } else {
          toast.error(result.message);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [targets]
  );

  // 最近のフォルダ取得
  const fetchRecentDirs = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await listRecentFoldersAction();
      if (result.success) {
        const folderIds = new Set(
          targets.filter((t) => t.isDirectory).map((t) => t.id)
        );
        // ループ防止のフィルタリング
        const filtered = result.folders.filter(
          (f) => !folderIds.has(f.folderId)
        );
        setRecentDirs(filtered);
      }
    } finally {
      setIsLoading(false);
    }
  }, [targets]);

  // ダイアログを開く
  const open = useCallback(
    async (targets: Node[], initialFolder: Folder) => {
      setInitialFolder(initialFolder);
      setCurrentFolder(initialFolder);
      setTargets(targets);
      setIsOpen(true);
      await refreshSubFolders(initialFolder.id);
      await getSubFolders(initialFolder.id);
      await fetchRecentDirs();
    },
    [getSubFolders, fetchRecentDirs]
  );

  // ダイアログを閉じる
  const close = useCallback(() => {
    setIsOpen(false);
    setSubFolders([]);
    setRecentDirs([]);
  }, []);

  // 特定のフォルダに深く潜る/切り替える
  const changeCurrentFolder = useCallback(
    async (folder: Folder) => {
      setCurrentFolder(folder);
      await refreshSubFolders(folder.id);
      await getSubFolders(folder.id);
    },
    [getSubFolders]
  );

  // 親階層へ戻る
  const goBackParentFolder = useCallback(async () => {
    if (!currentFolder?.parentFolderId) return;
    const parent = await getParentFolderAction(currentFolder.parentFolderId);
    if (parent) {
      changeCurrentFolder(parent);
    }
  }, [currentFolder, changeCurrentFolder]);

  // ピン留め切り替え
  const togglePin = useCallback(
    async (folderId: string, currentPinned: boolean) => {
      setIsLoading(true);
      try {
        const result = await togglePinVisitedFolderAction({
          folderId,
          currentPinned,
        });
        if (result.success) {
          void fetchRecentDirs();
        } else {
          toast.error(result.message);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [fetchRecentDirs]
  );

  // 移動実行
  const performMove = useCallback(async () => {
    if (!currentFolder) return;

    const folderIds = targets.map((t) => t.id);

    setIsPending(true);
    try {
      const result = await moveManyNodesAction({
        sourcePaths: paths,
        destDirPath: currentFolder,
      });

      if (result.success) {
        if (result.completed.length > 0) {
          toast.success(
            `${result.completed.length} 件のアイテムを移動しました`
          );
        }
        if (result.failed.length > 0) {
          toast.success(
            `${result.failed.length} 件のアイテムの移動に失敗しました`
          );
        }
        if (result.skipped.length > 0) {
          toast.success(
            `${result.skipped.length} 件のアイテムの移動をスキップしました`
          );
        }
        onSuccess?.();
        close();
      } else {
        toast.error(result.message);
      }
    } finally {
      setIsPending(false);
    }
  }, [currentFolder, targets, onSuccess, close]);

  return {
    isOpen,
    initialDir: initialFolder,
    currentDir: currentFolder,
    dirs: subFolders,
    recentDirs,
    isLoading,
    isPending,
    open,
    close,
    changeDir: changeCurrentFolder,
    goBackParent: goBackParentFolder,
    togglePin,
    performMove,
  };
}
