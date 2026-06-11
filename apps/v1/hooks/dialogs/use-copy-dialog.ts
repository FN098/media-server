import { listRecentFoldersAction } from "@/actions/folder/list-recent";
import { listSubDirectoriesAction } from "@/actions/folder/list-sub";
import { togglePinVisitedFolderAction } from "@/actions/folder/toggle-pin-visited";
import { copyNodesAction } from "@/actions/node/copy";
import { dirname } from "path";
import { useCallback, useState } from "react";
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
  const [isPending, setIsPending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 通常のフォルダ一覧取得
  const fetchDirs = useCallback(
    async (path: string) => {
      setIsLoading(true);
      try {
        const result = await listSubDirectoriesAction(path);
        if (result.success) {
          // ループ防止のフィルタリング
          const filtered = result.directories.filter(
            (d) =>
              !targets.some(
                (sn) => d.path === sn.path || d.path.startsWith(sn.path + "/")
              )
          );
          setDirs(filtered);
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
        const filtered = (result.data ?? []).filter(
          (d: RecentDirectoryInfo) =>
            !targets.some(
              (sn) => d.path === sn.path || d.path.startsWith(sn.path + "/")
            )
        );
        setRecentDirs(filtered);
      }
    } finally {
      setIsLoading(false);
    }
  }, [targets]);

  // ダイアログを開く
  const open = useCallback(
    (targets: CopyTarget[], path: string) => {
      setInitialDir(path);
      setCurrentDir(path);
      setTargets(targets);
      setIsOpen(true);
      void fetchDirs(path);
      void fetchRecentDirs();
    },
    [fetchDirs, fetchRecentDirs]
  );

  // ダイアログを閉じる
  const close = useCallback(() => {
    setIsOpen(false);
    setDirs([]);
    setRecentDirs([]);
  }, []);

  // 特定のフォルダに深く潜る/切り替える
  const changeDir = useCallback(
    (path: string) => {
      setCurrentDir(path);
      void fetchDirs(path);
    },
    [fetchDirs]
  );

  // 親階層へ戻る
  const goBackParent = useCallback(() => {
    const parent = dirname(currentDir).replace(/\\/g, "/");
    const path = parent === "." ? "" : parent;
    changeDir(path);
  }, [currentDir, changeDir]);

  // ピン留め切り替え
  const togglePin = useCallback(
    async (path: string, currentPinned: boolean) => {
      setIsLoading(true);
      try {
        const result = await togglePinVisitedFolderAction(path, currentPinned);
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

  // コピー実行
  const performCopy = useCallback(async () => {
    if (!currentDir) return;
    const paths = targets.map((n) => n.path);

    setIsPending(true);
    try {
      const result = await copyNodesAction(paths, currentDir);
      if (result.success) {
        if (result.completed.length > 0) {
          toast.success(
            `${result.completed.length} 件のアイテムをコピーしました`
          );
        }
        if (result.failed.length > 0) {
          toast.success(
            `${result.failed.length} 件のアイテムのコピーに失敗しました`
          );
        }
        if (result.skipped.length > 0) {
          toast.success(
            `${result.skipped.length} 件のアイテムのコピーをスキップしました`
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
  }, [currentDir, targets, close, onSuccess]);

  return {
    isOpen,
    initialDir,
    currentDir,
    dirs,
    recentDirs,
    isLoading,
    isPending,
    open,
    close,
    changeDir,
    goBackParent,
    togglePin,
    performCopy,
  };
}
