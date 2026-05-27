import {
  touchMediaTimestampAction,
  updatePreviewAction,
} from "@/actions/media-actions";
import {
  enqueueCreateSingleThumbJobAction,
  enqueueCreateThumbsJobAction,
} from "@/actions/thumb-actions";
import { MediaNode } from "@/lib/media/types";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export type TrashThumbs = ReturnType<typeof useTrashThumbs>;

interface UseTrashThumbsProps {
  currentDir: string;
  selectedNodes: MediaNode[];
  autoCreateThumbs?: boolean;
}

export function useTrashThumbs({
  currentDir,
  selectedNodes,
  autoCreateThumbs = true,
}: UseTrashThumbsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // 排他制御
  const updatingRef = useRef(false);

  // サムネイル自動作成
  useEffect(() => {
    if (!currentDir || !autoCreateThumbs) return;

    void enqueueCreateThumbsJobAction(currentDir);
  }, [autoCreateThumbs, currentDir]);

  const update = useCallback(
    async (node: MediaNode) => {
      if (updatingRef.current) return;

      updatingRef.current = true;
      setIsLoading(true);

      try {
        await updateThumb(node);

        router.refresh();
      } finally {
        updatingRef.current = false;
        setIsLoading(false);
      }
    },
    [router]
  );

  const updateSelected = useCallback(async () => {
    if (updatingRef.current) return;

    updatingRef.current = true;
    setIsLoading(true);

    try {
      // 並列化
      await Promise.all(selectedNodes.map(updateThumb));

      router.refresh();
    } finally {
      updatingRef.current = false;
      setIsLoading(false);
    }
  }, [router, selectedNodes]);

  return {
    isLoading,
    update,
    updateSelected,
  };
}

const updateThumb = async (node: MediaNode) => {
  // サムネイル再生成ジョブ投入
  const queued = await enqueueCreateSingleThumbJobAction(node.path, {
    force: true,
  });

  if (queued?.error) {
    toast.error(queued.error);
    return;
  }

  // DB timestamp 更新
  if (!node.isDirectory) {
    const touched = await touchMediaTimestampAction(node.path);

    if (touched.error) {
      toast.error(touched.error);
    }
  }

  // preview リセット
  const updated = await updatePreviewAction(node.path, null);

  if (updated.error) {
    toast.error(updated.error);
  }
};
