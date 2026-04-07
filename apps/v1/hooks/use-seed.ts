"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export function useSeed() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 現在のURLからseedを取得
  const currentSeed = searchParams.get("seed");

  // 新しいシードを生成してURLを更新する
  const updateSeed = useCallback(() => {
    const newSeed = Math.random().toString(36).substring(2, 9);
    const params = new URLSearchParams(searchParams.toString());

    params.delete("sort");
    params.set("direction", "random");
    params.set("seed", newSeed);

    router.push(`${pathname}?${params.toString()}`);
    return newSeed;
  }, [pathname, router, searchParams]);

  return { seed: currentSeed, updateSeed };
}
