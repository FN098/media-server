"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export const useReplaceQuery = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (next: Record<string, string | number | null | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(next)) {
      if (value === null || value === undefined) {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    }

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };
};

export const useReplaceQuerySilently = () => {
  return (next: Record<string, string | number | null | undefined>) => {
    const url = new URL(window.location.href);

    for (const [key, value] of Object.entries(next)) {
      if (value === null || value === undefined) {
        url.searchParams.delete(key);
      } else {
        url.searchParams.set(key, String(value));
      }
    }

    window.history.replaceState(null, "", url.toString());
  };
};
