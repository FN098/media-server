import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface UseShuffleProps {
  shuffleKey?: string;
  seedKey?: string;
}

export function useShuffle({
  shuffleKey = "shuffle",
  seedKey = "seed",
}: UseShuffleProps = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const shuffle = searchParams.get(shuffleKey);
  const seed = searchParams.get(seedKey);

  const enabled = shuffle == "true";

  // 新しいシードを生成してURLを更新する
  const update = useCallback(() => {
    const newSeed = generateSeed();
    const params = new URLSearchParams(searchParams.toString());

    params.set(shuffleKey, "true");
    params.set(seedKey, newSeed);

    router.push(`${pathname}?${params.toString()}`);
    return newSeed;
  }, [pathname, router, searchParams, seedKey, shuffleKey]);

  // シード状態をリセット
  const reset = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());

    params.delete(shuffleKey);
    params.delete(seedKey);

    router.push(`${pathname}?${params.toString()}`);
  }, [pathname, router, searchParams, seedKey, shuffleKey]);

  return { enabled, seed, update, reset };
}

function generateSeed() {
  return Math.random().toString(36).substring(2, 9);
}
