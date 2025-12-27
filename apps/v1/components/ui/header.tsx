"use client";

import { AppSidebarOpenButton } from "@/components/ui/app-sidebar";
import { DynamicBreadcrumbs } from "@/components/ui/breadcrumbs";
import { Search } from "@/components/ui/search";
import { ViewModeSwitch } from "@/components/ui/view-mode-switch";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useMounted } from "@/hooks/use-mounted";
import { useSearchOptional } from "@/providers/search-provider";
import { useViewModeOptional } from "@/providers/view-mode-provider";
import { Separator } from "@/shadcn/components/ui/separator";
import { useIsMobile } from "@/shadcn/hooks/use-mobile";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

type HeaderFeatures = {
  navigation?: boolean;
  search?: boolean;
  viewMode?: boolean;
};

type HeaderProps = {
  title: string;
  basePath?: string;
  features?: HeaderFeatures;
};

const DEFAULT_FEATURES: Required<HeaderFeatures> = {
  navigation: true,
  search: true,
  viewMode: true,
};

export function Header({ title, basePath, features }: HeaderProps) {
  const mergedFeatures = {
    ...DEFAULT_FEATURES,
    ...features,
  };
  const searchCtx = useSearchOptional();
  const viewCtx = useViewModeOptional();
  const isMobile = useIsMobile();
  const breadcrumbs = useBreadcrumbs(basePath ?? "");
  const mounted = useMounted();

  const current = breadcrumbs.at(-1);
  const backHref = breadcrumbs.at(-2)?.href ?? null;

  const { navigation, search, viewMode } = mergedFeatures;

  if (!mounted) return null;

  // Mobile
  if (isMobile) {
    return (
      <header className="sticky top-0 z-5 h-12 border-b bg-white dark:bg-gray-900">
        <div className="flex h-full items-center gap-2 px-2">
          <AppSidebarOpenButton />

          <div className="text-lg font-semibold mx-2 hidden sm:block">
            {title}
          </div>

          {/* ナビゲーション */}
          {navigation && (
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

              <div className="min-w-0 flex-1 text-sm font-medium truncate">
                {current?.label ?? ""}
              </div>
            </>
          )}

          {search && searchCtx && (
            <Search
              value={searchCtx.query}
              setValue={searchCtx.setQuery}
              className="w-[100px] shrink-0"
            />
          )}

          {viewMode && viewCtx && (
            <ViewModeSwitch
              value={viewCtx.view}
              setValue={viewCtx.setView}
              className="shrink-0"
            />
          )}
        </div>
      </header>
    );
  }

  // PC
  return (
    <>
      <header className="sticky top-0 z-5 h-12 border-b bg-white dark:bg-gray-900">
        <div className="flex h-full items-center gap-2 px-3">
          <AppSidebarOpenButton />

          <div className="text-lg font-semibold mx-2">{title}</div>

          {/* ナビゲーション */}
          {navigation && (
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

              <DynamicBreadcrumbs items={breadcrumbs} />
            </>
          )}

          <div className="ml-auto flex items-center gap-2">
            {search && searchCtx && (
              <Search
                value={searchCtx.query}
                setValue={searchCtx.setQuery}
                className="w-[180px] shrink-0"
              />
            )}

            <Separator orientation="vertical" className="h-6" />

            {viewMode && viewCtx && (
              <ViewModeSwitch
                value={viewCtx.view}
                setValue={viewCtx.setView}
                className="shrink-0"
              />
            )}
          </div>
        </div>
      </header>
    </>
  );
}
