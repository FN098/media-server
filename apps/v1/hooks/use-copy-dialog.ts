import {
  listRecentFoldersAction,
  listSubDirectoriesAction,
  togglePinVisitedFolderAction,
} from "@/lib/folder/actions";
import { copyNodesAction } from "@/lib/media/actions";
import { dirname } from "path";
import { useCallback, useState, useTransition } from "react";
import { toast } from "sonner";

type DirectoryInfo = {
  name: string;
  path: string;
};

type RecentDirectoryInfo = DirectoryInfo & {
  pinned: boolean;
};

type CopyTarget = {
  path: string;
};

interface UseCopyDialogProps {
  onSuccess?: () => void;
}

export function useCopyDialog({ onSuccess }: UseCopyDialogProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialDir, setInitialDir] = useState<string>("");
  const [currentDir, setCurrentDir] = useState<string>("");
  const [dirs, setDirs] = useState<DirectoryInfo[]>([]);
  const [recentDirs, setRecentDirs] = useState<RecentDirectoryInfo[]>([]);
  const [targets, setTargets] = useState<CopyTarget[]>([]);

  const [isNavigating, startNavigating] = useTransition();
  const [isCopying, startCopying] = useTransition();
  const isLoading = isNavigating || isCopying;

  // 1. 通常のフォルダ一覧取得
  const fetchDirs = useCallback(
    (path: string) => {
      startNavigating(async () => {
        const result = await listSubDirectoriesAction(path);
        if (result.success) {
          // ループ防止のフィルタリング
          const filtered = result.directories!.filter(
            (d) =>
              !targets.some(
                (sn) => d.path === sn.path || d.path.startsWith(sn.path + "/")
              )
          );
          setDirs(filtered);
        } else {
          toast.error(result.error);
        }
      });
    },
    [targets]
  );

  // 2. 最近のフォルダ取得
  const fetchRecentDirs = useCallback(() => {
    startNavigating(async () => {
      const result = await listRecentFoldersAction();
      if (result.success) {
        const filtered = (result.data ?? []).filter(
          (d: RecentDirectoryInfo) =>
            !targets.some(
              (sn) => d.path === sn.path || d.path.startsWith(sn.path + "/")
            )
        );
        setRecentDirs(filtered);
      }
    });
  }, [targets]);

  // 3. ダイアログを開く
  const open = useCallback(
    (targets: CopyTarget[], path: string) => {
      setInitialDir(path);
      setCurrentDir(path);
      setTargets(targets);
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
      const paths = targets.map((n) => n.path);
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
  }, [currentDir, targets, close, onSuccess]);

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
