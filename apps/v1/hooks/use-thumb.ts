"use client";

import { enqueueThumbJob } from "@/actions/thumb-actions";
import { useCallback, useMemo } from "react";

export function useThumb() {
  // サムネイル作成リクエスト送信
  const sendCreateThumbRequest = useCallback(async (path: string) => {
    await enqueueThumbJob(path);
  }, []);

  return useMemo(
    () => ({
      sendCreateThumbRequest,
    }),
    [sendCreateThumbRequest]
  );
}
