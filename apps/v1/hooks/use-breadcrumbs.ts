"use client";

import { BreadcrumbLinkItem } from "@/components/ui/breadcrumbs";
import { usePathname } from "next/navigation";
import path from "path";
import { useMemo } from "react";

type BreadcrumbFormatContext = {
  part: string;
  index: number;
  parts: string[];
  href: string;
  isLast: boolean;
};

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function useBreadcrumbs(
  basePath: string,
  formatLabel?: (ctx: BreadcrumbFormatContext) => string
) {
  const pathname = usePathname();

  return useMemo<BreadcrumbLinkItem[]>(() => {
    const parts = pathname
      .replace(new RegExp(`^${escapeRegExp(basePath)}/?`), "")
      .split("/")
      .filter(Boolean)
      .map(decodeURIComponent);

    return [
      { key: "home", label: "Home", href: basePath },
      ...parts.map((part, index) => {
        const relativePath = parts.slice(0, index + 1).join("/");
        const href = path.join(basePath, relativePath);
        const label =
          formatLabel?.({
            part,
            index,
            parts,
            href,
            isLast: index === parts.length - 1,
          }) ?? part;

        return {
          key: href,
          label,
          href,
        };
      }),
    ];
  }, [pathname, basePath, formatLabel]);
}
