import {
  listRecentFoldersAction,
  listSubDirectoriesAction,
  togglePinVisitedFolderAction,
} from "@/lib/folder/actions";
import { moveNodesAction } from "@/lib/media/actions";
import { MediaNode } from "@/lib/media/types";
import { dirname } from "path";
import { useCallback, useState, useTransition } from "react";
import { toast } from "sonner";

export type DirectoryInfo = { name: string; path: string };
export type RecentDirectoryInfo = DirectoryInfo & { pinned: boolean };

interface UseMoveDialogProps {
  onSuccess?: () => void;
}

export function useMoveDialog({ onSuccess }: UseMoveDialogProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialDir, setInitialDir] = useState<string>("");
  const [currentDir, setCurrentDir] = useState<string>("");
  const [dirs, setDirs] = useState<DirectoryInfo[]>([]);
  const [recentDirs, setRecentDirs] = useState<RecentDirectoryInfo[]>([]);
  const [sourceNodes, setSourceNodes] = useState<MediaNode[]>([]);

  const [isNavigating, startNavigating] = useTransition();
  const [isMoving, startMoving] = useTransition();
  const isLoading = isNavigating || isMoving;

  // 1. 通常のフォルダ一覧取得
  const fetchDirs = useCallback(
    (path: string) => {
      startNavigating(async () => {
        const result = await listSubDirectoriesAction(path);
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
      const result = await listRecentFoldersAction();
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

  // 8. 移動実行
  const performMove = useCallback(() => {
    if (!currentDir) return;
    startMoving(async () => {
      const paths = sourceNodes.map((n) => n.path);
      const result = await moveNodesAction(paths, currentDir);

      if (result.failed === 0) {
        toast.success(`${result.success}件のアイテムを移動しました`);
        onSuccess?.();
        close();
      } else {
        toast.error(
          `${result.failed}件の移動に失敗しました\n${result.errors.join("\n")}`
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
    isMoving,
    open,
    close,
    changeDir,
    goBackParent,
    togglePin,
    performMove,
  };
}
