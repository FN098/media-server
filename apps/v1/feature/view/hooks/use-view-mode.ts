import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export type ViewMode = "list" | "grid";

type UseViewModeProps = {
  viewModeKey?: string;
  defaultViewMode?: ViewMode;
  history?: "push" | "replace";
};

export function useViewMode({
  viewModeKey = "viewMode",
  defaultViewMode = "grid",
  history = "replace",
}: UseViewModeProps = {}) {
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
