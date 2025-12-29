"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function useModalNavigation(key: string = "modal") {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isOpen = searchParams.get(key) === "true";

  const openModal = () => {
    // 履歴を 1 つ進めてモーダルを表示
    router.push(`${pathname}?${key}=true`);
  };

  const closeModal = () => {
    // 履歴を戻すことでモーダルを閉じる
    router.back();
  };

  return { isOpen, openModal, closeModal };
}
