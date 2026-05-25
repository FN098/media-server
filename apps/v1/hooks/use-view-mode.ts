"use client";

import { ViewMode } from "@/lib/view-mode";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

type Options = {
  viewModeKey?: string; // デフォルト: "viewMode"
  defaultViewMode?: ViewMode; // デフォルト: "grid"
  history?: "push" | "replace"; // デフォルト: "replace"
};

export function useViewMode(options?: Options) {
  const {
    viewModeKey = "viewMode",
    defaultViewMode = "grid",
    history = "replace",
  } = options || {};

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const navigate = useCallback(
    (url: string) => {
      if (history === "push") {
        router.push(url, { scroll: false });
      } else {
        router.replace(url, { scroll: false });
      }
    },
    [history, router]
  );

  const value = (searchParams.get(viewModeKey) as ViewMode) || defaultViewMode;

  const apply = useCallback(
    (next: ViewMode) => {
      const params = new URLSearchParams(searchParams.toString());

      if (next === defaultViewMode) {
        params.delete(viewModeKey);
      } else {
        params.set(viewModeKey, next);
      }

      navigate(`${pathname}?${params.toString()}`);
    },
    [defaultViewMode, navigate, pathname, searchParams, viewModeKey]
  );

  const reset = useCallback(
    () => apply(defaultViewMode),
    [apply, defaultViewMode]
  );

  return {
    value,
    apply,
    reset,
  };
}
