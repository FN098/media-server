import { touchTimestampAction } from "@/__feature/node/actions/touch-timestamp";
import { updatePreviewFileAction } from "@/__feature/preview/actions/update";
import { enqueueCreateSingleThumbJobAction } from "@/feature/thumbnail/actions/enque-create-thumb-job";
import { enqueueCreateThumbsJobAction } from "@/feature/thumbnail/actions/enque-create-thumbs-job";
import { Node, NodeListing } from "@/lib/node/types";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface UseExplorerThumbsProps {
  listing: NodeListing;
  autoCreateThumbs?: boolean;
}

export function useExplorerThumbs({
  listing,
  autoCreateThumbs = true,
}: UseExplorerThumbsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // 排他制御
  const updatingRef = useRef(false);

  const folderId = listing.folderId;

  // サムネイル自動作成
  useEffect(() => {
    if (!folderId || !autoCreateThumbs) return;
    void enqueueCreateThumbsJobAction({ folderId });
  }, [autoCreateThumbs, folderId]);

  const update = useCallback(
    async (node: Node) => {
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
    async (nodes: Node[]) => {
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

const updateThumb = async (node: Node) => {
  // サムネイル再生成ジョブ投入
  const enqueResult = await enqueueCreateSingleThumbJobAction({
    fileId: node.id,
    forceCreate: true,
  });
  if (!enqueResult.success) {
    toast.error(enqueResult.message);
    return;
  }

  // タイムスタンプ更新
  if (!node.isDirectory) {
    const touchResult = await touchTimestampAction({
      id: node.id,
      isDirectory: node.isDirectory,
    });
    if (!touchResult.success) {
      toast.error(touchResult.message);
      return;
    }
  }

  // プレビュー画像リセット
  const previewResult = await updatePreviewFileAction({
    id: node.id,
    isDirectory: node.isDirectory,
    previewFileId: null,
  });
  if (!previewResult.success) {
    toast.error(previewResult.message);
    return;
  }
};

export type ExplorerThumbs = ReturnType<typeof useExplorerThumbs>;
