"use client";

import { DynamicBreadcrumbs } from "@/components/ui/breadcrumbs/dynamic-breadcrumbs";
import { ClickToCopy } from "@/components/ui/texts/click-to-copy";
import { useBreadcrumbs } from "@/hooks/navigations/use-breadcrumbs";
import { useDetectMobileContext } from "@/providers/mobile-provider";
import { ArrowUp } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export function HeaderNavigation({ basePath }: { basePath?: string }) {
  const searchParams = useSearchParams();
  const breadcrumbs = useBreadcrumbs(basePath ?? "");
  const isMobile = useDetectMobileContext();
  const current = breadcrumbs.at(-1);
  const backHref = breadcrumbs.at(-2)?.href ?? null;
  const params = new URLSearchParams(searchParams);

  // 不要なパラメータを削除
  params.delete("page");
  params.delete("q");

  const withParams = (path: string) =>
    params.toString() ? `${path}?${params.toString()}` : path;

  return (
    <>
      {backHref ? (
        <Link
          href={withParams(backHref)}
          className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
        >
          <ArrowUp className="h-5 w-5" />
        </Link>
      ) : (
        <div className="flex h-8 w-8 items-center justify-center opacity-40">
          <ArrowUp className="h-5 w-5" />
        </div>
      )}

      {isMobile ? (
        <div className="min-w-0 flex-1 text-sm font-medium truncate">
          <ClickToCopy>{current?.label ?? ""}</ClickToCopy>
        </div>
      ) : (
        <DynamicBreadcrumbs
          items={breadcrumbs.map((b) => ({
            ...b,
            href: withParams(b.href),
          }))}
        />
      )}
    </>
  );
}
