"use client";

import { DynamicBreadcrumbs } from "@/components/ui/breadcrumbs";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useIsMobile } from "@/shadcn/hooks/use-mobile";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export function HeaderNavigation({ basePath }: { basePath?: string }) {
  const breadcrumbs = useBreadcrumbs(basePath ?? "");
  const isMobile = useIsMobile();
  const current = breadcrumbs.at(-1);
  const backHref = breadcrumbs.at(-2)?.href ?? null;

  return (
    <>
      {backHref ? (
        <Link
          href={backHref}
          className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
      ) : (
        <div className="flex h-8 w-8 items-center justify-center opacity-40">
          <ArrowLeft className="h-5 w-5" />
        </div>
      )}

      {isMobile ? (
        <div className="min-w-0 flex-1 text-sm font-medium truncate">
          {current?.label ?? ""}
        </div>
      ) : (
        <DynamicBreadcrumbs items={breadcrumbs} />
      )}
    </>
  );
}
