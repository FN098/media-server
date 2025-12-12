"use client";

import { PATHS } from "@/app/lib/paths";
import { BreadcrumbLinkItem, Breadcrumbs } from "@/app/ui/breadcrumbs";
import { usePathname } from "next/navigation";
import path from "path";

export function ExplorerBreadcrumbs({ className }: { className?: string }) {
  const pathname = usePathname();

  // pathParts から Breadcrumb[] を作る
  const pathParts = pathname
    .replace(/^\/dashboard\/explorer\/?/, "")
    .split("/")
    .filter(Boolean)
    .map(decodeURIComponent);

  const breadcrumbs: BreadcrumbLinkItem[] = [
    { key: "home", label: "Home", href: "/dashboard" },
    { key: "explorer", label: "Explorer", href: "/dashboard/explorer" },
    ...pathParts.map((part, i) => ({
      key: part,
      label: part,
      href: path.join(
        PATHS.client.explorer,
        pathParts.slice(0, i + 1).join("/")
      ),
    })),
  ];

  return (
    <Breadcrumbs
      items={breadcrumbs}
      options={{ threshold: 20 }}
      className={className}
    />
  );
}
