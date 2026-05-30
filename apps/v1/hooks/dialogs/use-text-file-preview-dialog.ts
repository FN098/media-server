import { useCallback, useState } from "react";

type FilePreviewData = {
  title: string;
  content: string;
  encoding?: string;
  isTruncated?: boolean;
};

export function useTextFilePreviewDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [target, setTarget] = useState<FilePreviewData | null>(null);

  // ダイアログを開く
  const open = useCallback((data: FilePreviewData) => {
    setTarget(data);
    setIsOpen(true);
  }, []);

  // ダイアログを閉じる
  const close = useCallback(() => {
    setIsOpen(false);
    // 閉じアニメーションが終わる前に中身が消えてガタつくのを防ぐため、少し遅らせてクリアしても良い
    setTarget(null);
  }, []);

  return {
    isOpen,
    title: target?.title ?? "",
    content: target?.content ?? "",
    encoding: target?.encoding ?? "UTF-8",
    isTruncated: target?.isTruncated ?? false,
    open,
    close,
  };
}
