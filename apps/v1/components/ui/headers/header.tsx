import {
  HeaderNavigation,
  HeaderSearch,
  HeaderViewModeSwitch,
} from "@/components/ui/headers/header-components";
import { AppSidebarOpenButton } from "@/components/ui/sidebars/app-sidebar";
import { Separator } from "@/shadcn/components/ui/separator";

type HeaderFeatures = {
  navigation?: boolean;
  search?: boolean;
  viewMode?: boolean;
};

export function Header({
  title,
  basePath,
  features,
}: {
  title: string;
  basePath?: string;
  features?: HeaderFeatures;
}) {
  const navigation = features?.navigation ?? true;
  const search = features?.search ?? true;
  const viewMode = features?.viewMode ?? true;

  return (
    <header className="sticky top-0 z-5 h-12 border-b bg-white dark:bg-gray-900">
      <div className="flex h-full items-center gap-2 px-2 md:px-3">
        <AppSidebarOpenButton />

        <div className="text-lg font-semibold mx-2 hidden sm:block">
          {title}
        </div>

        {navigation && <HeaderNavigation basePath={basePath} />}

        <div className="ml-auto flex items-center gap-2">
          {search && <HeaderSearch />}
          {search && viewMode && (
            <Separator orientation="vertical" className="h-6" />
          )}
          {viewMode && <HeaderViewModeSwitch />}
        </div>
      </div>
    </header>
  );
}
