"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function useModalNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 特定のクエリ（例: ?show=true）があるかどうかで判定
  const isOpen = searchParams.get("modal") === "true";

  const openModal = () => {
    // 履歴を 1 つ進めてモーダルを表示
    router.push(`${pathname}?modal=true`);
  };

  const closeModal = () => {
    // 履歴を戻すことでモーダルを閉じる
    router.back();
  };

  return { isOpen, openModal, closeModal };
}
