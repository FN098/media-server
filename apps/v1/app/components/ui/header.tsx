"use client";

import { AppSidebarOpenButton } from "@/app/components/ui/app-sidebar-buttons";
import { Breadcrumbs } from "@/app/components/ui/breadcrumbs";
import { Search } from "@/app/components/ui/search";
import { ViewModeSwitch } from "@/app/components/ui/view-mode-switch";
import { useBreadcrumbs } from "@/app/hooks/use-breadcrumbs";
import { useMounted } from "@/app/hooks/use-mounted";
import { useSearch } from "@/app/providers/search-provider";
import { useViewMode } from "@/app/providers/view-mode-provider";
import { useIsMobile } from "@/shadcn/hooks/use-mobile";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const basePath = "/dashboard/explorer";

export function Header() {
  const { search, setSearch } = useSearch();
  const { view, setView } = useViewMode();
  const isMobile = useIsMobile();
  const breadcrumbs = useBreadcrumbs(basePath);
  const mounted = useMounted();

  if (!mounted) return null;

  if (isMobile) {
    const current = breadcrumbs.at(-1);
    const backHref = breadcrumbs.at(-2)?.href ?? null;

    return (
      <>
        <header className="sticky top-0 z-10 h-12 border-b bg-white dark:bg-gray-900">
          <div className="flex h-full items-center gap-2 px-2">
            <AppSidebarOpenButton />

            {/* 戻る */}
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

            <div className="min-w-0 flex-1 text-sm font-medium truncate">
              {current?.label ?? ""}
            </div>

            <Search
              value={search}
              setValue={setSearch}
              className="w-22 shrink-0"
            />
            <ViewModeSwitch
              value={view}
              setValue={setView}
              className="shrink-0"
            />
          </div>
        </header>

        <div className="pt-12" />
      </>
    );
  }

  // Desktop
  return (
    <>
      <header className="sticky top-0 z-10 h-12 border-b bg-white dark:bg-gray-900">
        <div className="flex h-full items-center gap-2 px-3">
          <Breadcrumbs
            items={breadcrumbs}
            options={{ threshold: 10 }}
            className="min-w-0 whitespace-nowrap overflow-hidden text-ellipsis"
          />

          <div className="ml-auto flex items-center gap-2">
            <Search
              value={search}
              setValue={setSearch}
              className="w-[180px] shrink-0"
            />
            <ViewModeSwitch
              value={view}
              setValue={setView}
              className="shrink-0"
            />
          </div>
        </div>
      </header>

      <div className="pt-12" />
    </>
  );
}
