"use client";

import { EXPLORER_PATH } from "@/app/lib/path";
import { BreadcrumbLinkItem, Breadcrumbs } from "@/app/ui/breadcrumbs";
import { usePathname } from "next/navigation";

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
      href: EXPLORER_PATH + pathParts.slice(0, i + 1).join("/"),
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
