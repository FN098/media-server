import {
  getRecentFoldersAction,
  togglePinVisitedFolderAction,
} from "@/lib/folder/actions";
import { copyNodesAction, getSubDirectoriesAction } from "@/lib/media/actions";
import { MediaNode } from "@/lib/media/types";
import { dirname } from "path";
import { useCallback, useState, useTransition } from "react";
import { toast } from "sonner";

export type DirectoryInfo = { name: string; path: string };
export type RecentDirectoryInfo = DirectoryInfo & { pinned: boolean };

interface UseCopyDialogProps {
  onSuccess?: () => void;
}

export function useCopyDialog({ onSuccess }: UseCopyDialogProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialDir, setInitialDir] = useState<string>("");
  const [currentDir, setCurrentDir] = useState<string>("");
  const [dirs, setDirs] = useState<DirectoryInfo[]>([]);
  const [recentDirs, setRecentDirs] = useState<RecentDirectoryInfo[]>([]);
  const [sourceNodes, setSourceNodes] = useState<MediaNode[]>([]);

  const [isNavigating, startNavigating] = useTransition();
  const [isCopying, startCopying] = useTransition();
  const isLoading = isNavigating || isCopying;

  // 1. 通常のフォルダ一覧取得
  const fetchDirs = useCallback(
    (path: string) => {
      startNavigating(async () => {
        const result = await getSubDirectoriesAction(path);
        if (result.success) {
          // ループ防止のフィルタリング
          const filtered = result.directories!.filter(
            (d) =>
              !sourceNodes.some(
                (sn) => d.path === sn.path || d.path.startsWith(sn.path + "/")
              )
          );
          setDirs(filtered);
        } else {
          toast.error(result.error);
        }
      });
    },
    [sourceNodes]
  );

  // 2. 最近のフォルダ取得
  const fetchRecentDirs = useCallback(() => {
    startNavigating(async () => {
      const result = await getRecentFoldersAction();
      if (result.success) {
        const filtered = (result.data ?? []).filter(
          (d: RecentDirectoryInfo) =>
            !sourceNodes.some(
              (sn) => d.path === sn.path || d.path.startsWith(sn.path + "/")
            )
        );
        setRecentDirs(filtered);
      }
    });
  }, [sourceNodes]);

  // 3. ダイアログを開く
  const open = useCallback(
    (sourceNodes: MediaNode[], path: string) => {
      setInitialDir(path);
      setCurrentDir(path);
      setSourceNodes(sourceNodes);
      setIsOpen(true);
      fetchDirs(path);
      fetchRecentDirs();
    },
    [fetchDirs, fetchRecentDirs]
  );

  // 4. ダイアログを閉じる
  const close = useCallback(() => {
    setIsOpen(false);
    setDirs([]);
    setRecentDirs([]);
  }, []);

  // 5. 特定のフォルダに深く潜る/切り替える
  const changeDir = useCallback(
    (path: string) => {
      setCurrentDir(path);
      fetchDirs(path);
    },
    [fetchDirs]
  );

  // 6. 親階層へ戻る
  const goBackParent = useCallback(() => {
    const parent = dirname(currentDir).replace(/\\/g, "/");
    const path = parent === "." ? "/" : parent;
    changeDir(path);
  }, [currentDir, changeDir]);

  // 7. ピン留め切り替え
  const togglePin = useCallback(
    (path: string, currentPinned: boolean) => {
      startNavigating(async () => {
        const result = await togglePinVisitedFolderAction(path, currentPinned);
        if (result.success) {
          fetchRecentDirs();
        } else {
          toast.error(result.error || "ピン留めの更新に失敗しました");
        }
      });
    },
    [fetchRecentDirs]
  );

  // 8. コピー実行
  const performCopy = useCallback(() => {
    if (!currentDir) return;
    startCopying(async () => {
      const paths = sourceNodes.map((n) => n.path);
      const result = await copyNodesAction(paths, currentDir);

      if (result.failed === 0) {
        toast.success(`${result.success}件のアイテムをコピーしました`);
        onSuccess?.();
        close();
      } else {
        toast.error(
          `${result.failed}件のコピーに失敗しました\n${result.errors.join("\n")}`
        );
      }
    });
  }, [currentDir, sourceNodes, close, onSuccess]);

  return {
    isOpen,
    initialDir,
    currentDir,
    dirs,
    recentDirs,
    isLoading,
    isCopying,
    open,
    close,
    changeDir,
    goBackParent,
    togglePin,
    performCopy,
  };
}
