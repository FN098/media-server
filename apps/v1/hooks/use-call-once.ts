import { useEffect, useRef } from "react";

export function useCallOncePerKey(fn: () => void, key: string) {
  const calledKeysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (calledKeysRef.current.has(key)) return;
    calledKeysRef.current.add(key);
    fn();
  }, [key, fn]);
}

export function useCallOnceWhenChanged(
  fn: () => void,
  deps: readonly unknown[]
) {
  const prevDepsRef = useRef<readonly unknown[] | null>(null);
  const fnRef = useRef(fn);

  useEffect(() => {
    const prev = prevDepsRef.current;

    const changed =
      !prev ||
      prev.length !== deps.length ||
      prev.some((v, i) => !Object.is(v, deps[i]));

    if (!changed) return;

    prevDepsRef.current = deps;
    fnRef.current();
  }, [deps]); // ← ここ重要
}
