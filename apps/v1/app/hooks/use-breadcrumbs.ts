import { BreadcrumbLinkItem } from "@/app/components/ui/breadcrumbs";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

type BreadcrumbFormatContext = {
  part: string;
  index: number;
  parts: string[];
  href: string;
  isLast: boolean;
};

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const defaultFormatLabel = ({ part }: BreadcrumbFormatContext) =>
  part.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase());

export function useBreadcrumbs(
  basePath: string = "/dashboard",
  formatLabel: (ctx: BreadcrumbFormatContext) => string = defaultFormatLabel
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
        const href = `${basePath}/${parts.slice(0, index + 1).join("/")}`;
        return {
          key: href,
          label: formatLabel({
            part,
            index,
            parts,
            href,
            isLast: index === parts.length - 1,
          }),
          href,
        };
      }),
    ];
  }, [pathname, basePath, formatLabel]);
}
