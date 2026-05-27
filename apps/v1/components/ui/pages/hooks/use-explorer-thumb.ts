import {
  touchMediaTimestampAction,
  updatePreviewAction,
} from "@/actions/media-actions";
import {
  enqueueCreateSingleThumbJobAction,
  enqueueCreateThumbsJobAction,
} from "@/actions/thumb-actions";
import { MediaNode } from "@/lib/media/types";
import { useCallback, useEffect, useTransition } from "react";
import { toast } from "sonner";

export function useExplorerThumb({
  currentDir,
  selectedNodes,
  autoCreateThumbs = true,
}: UseExplorerThumbProps) {
  const [isPending, startTransition] = useTransition();

  // サムネイル自動作成
  useEffect(() => {
    if (currentDir && autoCreateThumbs) {
      void enqueueCreateThumbsJobAction(currentDir);
    }
  }, [autoCreateThumbs, currentDir]);

  const update = useCallback(
    (node: MediaNode) => {
      if (!isPending) {
        startTransition(async () => await updateThumb(node));
      }
    },
    [isPending]
  );

  const updateSelected = useCallback(() => {
    if (!isPending) {
      startTransition(async () => {
        for (const node of selectedNodes) {
          await updateThumb(node);
        }
      });
    }
  }, [isPending, selectedNodes]);

  return {
    isLoading: isPending,
    update,
    updateSelected,
  };
}

const updateThumb = async (node: MediaNode) => {
  // サムネイルを再作成（強制）
  await enqueueCreateSingleThumbJobAction(node.path, { force: true });

  // DBのタイムスタンプを更新（サムネイルのキャッシュを上書き）
  if (!node.isDirectory) {
    const touched = await touchMediaTimestampAction(node.path);
    if (touched.error) toast.error(touched.error);
  }

  // プレビュー設定を解除
  const updated = await updatePreviewAction(node.path, null);
  if (updated.error) toast.error(updated.error);
};

interface UseExplorerThumbProps {
  currentDir: string;
  selectedNodes: MediaNode[];
  autoCreateThumbs?: boolean;
}
