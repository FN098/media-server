import { enqueueCreateThumbsJobAction } from "@/lib/thumb-job/actions";
import { useCallback } from "react";

export function useThumb() {
  // サムネイル作成リクエスト送信
  const sendCreateThumbRequest = useCallback(async (path: string) => {
    await enqueueCreateThumbsJobAction(path);
  }, []);

  return {
    sendCreateThumbRequest,
  };
}
