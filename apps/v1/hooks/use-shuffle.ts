"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

type ShuffleOption = {
  sortKey?: string;
  directionKey?: string;
  seedKey?: string;
};

export function useShuffle(options: ShuffleOption = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // キー名のマッピング（デフォルト値を設定）
  const {
    sortKey = "sort",
    directionKey = "direction",
    seedKey = "seed",
  } = options || {};

  const sort = searchParams.get(sortKey);
  const direction = searchParams.get(directionKey);
  const seed = searchParams.get(seedKey);

  const enabled = sort == "none" || direction == "random" || seed != null;

  // 新しいシードを生成してURLを更新する
  const update = useCallback(() => {
    const newSeed = Math.random().toString(36).substring(2, 9);
    const params = new URLSearchParams(searchParams.toString());

    // params.delete(sortKey);
    params.set(sortKey, "none");
    params.set(directionKey, "random");
    params.set(seedKey, newSeed);

    router.push(`${pathname}?${params.toString()}`);
    return newSeed;
  }, [directionKey, pathname, router, searchParams, seedKey, sortKey]);

  // シード状態をリセット
  const reset = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());

    params.delete(sortKey);
    params.delete(directionKey);
    params.delete(seedKey);

    router.push(`${pathname}?${params.toString()}`);
  }, [directionKey, pathname, router, searchParams, seedKey, sortKey]);

  return { enabled, seed, update, reset };
}
