"use client";

import { BreadcrumbLinkItem, Breadcrumbs } from "@/app/ui/breadcrumbs";
import { usePathname } from "next/navigation";

export function ExplorerBreadcrumbs() {
  const pathname = usePathname();

  // pathParts から Breadcrumb[] を作る
  const pathParts = pathname
    .replace(/^\/explorer\/?/, "")
    .split("/")
    .filter(Boolean)
    .map(decodeURIComponent);

  const breadcrumbs: BreadcrumbLinkItem[] = [
    { key: "home", label: "HOME", href: "/explorer" },
    ...pathParts.map((part, i) => ({
      key: part,
      label: part,
      href: "/explorer/" + pathParts.slice(0, i + 1).join("/"),
    })),
  ];

  return <Breadcrumbs items={breadcrumbs} options={{ threshold: 20 }} />;
}
