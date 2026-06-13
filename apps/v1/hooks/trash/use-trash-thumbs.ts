import { touchMediaTimestampAction } from "@/actions/node/touch";
import { updatePreviewAction } from "@/actions/preview/update";
import { enqueueCreateSingleThumbJobAction } from "@/actions/thumb/enque-create-thumb-job";
import { enqueueCreateThumbsJobAction } from "@/actions/thumb/enque-create-thumbs-job";
import { MediaListing, MediaNode } from "@/lib/media/types";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface UseTrashThumbsProps {
  listing: MediaListing;
  autoCreateThumbs?: boolean;
}

export function useTrashThumbs({
  listing,
  autoCreateThumbs = true,
}: UseTrashThumbsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // 排他制御
  const updatingRef = useRef(false);

  const currentDir = listing.path;

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

  const updateParallel = useCallback(
    async (nodes: MediaNode[]) => {
      if (updatingRef.current) return;
      updatingRef.current = true;

      setIsLoading(true);
      try {
        await Promise.all(nodes.map(updateThumb));
        router.refresh();
      } finally {
        updatingRef.current = false;
        setIsLoading(false);
      }
    },
    [router]
  );

  return {
    isLoading,
    update,
    updateParallel,
  };
}

const updateThumb = async (node: MediaNode) => {
  // サムネイル再生成ジョブ投入
  const enqueResult = await enqueueCreateSingleThumbJobAction({
    filePath: node.path,
    options: {
      force: true,
    },
  });
  if (!enqueResult.success) {
    toast.error(enqueResult.message);
    return;
  }

  // DB timestamp 更新
  if (!node.isDirectory) {
    const touchResult = await touchMediaTimestampAction(node.path);
    if (!touchResult.success) {
      toast.error(touchResult.message);
      return;
    }
  }

  // preview リセット
  const updateResult = await updatePreviewAction(node.path, null);
  if (!updateResult.success) {
    toast.error(updateResult.message);
    return;
  }
};

export type TrashThumbs = ReturnType<typeof useTrashThumbs>;
