"use client";

import { DynamicBreadcrumbs } from "@/components/ui/breadcrumbs/dynamic-breadcrumbs";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useIsMobile } from "@/shadcn-overrides/hooks/use-mobile";
import { ArrowUp } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export function HeaderNavigation({ basePath }: { basePath?: string }) {
  const searchParams = useSearchParams();
  const breadcrumbs = useBreadcrumbs(basePath ?? "");
  const isMobile = useIsMobile();
  const current = breadcrumbs.at(-1);
  const backHref = breadcrumbs.at(-2)?.href ?? null;

  const withParams = (path: string) =>
    searchParams.toString() ? `${path}?${searchParams.toString()}` : path;

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
          {current?.label ?? ""}
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
