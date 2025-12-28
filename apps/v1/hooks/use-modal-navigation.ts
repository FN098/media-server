"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function useModalNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  // 特定のクエリ（例: ?show=true）があるかどうかで判定
  useEffect(() => {
    setIsOpen(searchParams.get("modal") === "true");
  }, [searchParams]);

  const openModal = () => {
    setIsOpen(true);

    // 履歴を 1 つ進めてモーダルを表示
    router.push(`${pathname}?modal=true`);
  };

  const closeModal = () => {
    setIsOpen(false);

    // 履歴を戻すことでモーダルを閉じる
    router.back();
  };

  return { isOpen, openModal, closeModal };
}
