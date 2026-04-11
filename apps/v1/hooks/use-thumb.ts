"use client";

import { enqueueThumbJobAction } from "@/actions/thumb-actions";
import { useCallback } from "react";

export function useThumb() {
  // サムネイル作成リクエスト送信
  const sendCreateThumbRequest = useCallback(async (path: string) => {
    await enqueueThumbJobAction(path);
  }, []);

  return {
    sendCreateThumbRequest,
  };
}
