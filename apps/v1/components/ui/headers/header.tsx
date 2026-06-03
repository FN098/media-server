import { HeaderNavigation } from "@/components/ui/headers/header-navigation";
import { HeaderSearch } from "@/components/ui/headers/header-search";
import { HeaderViewModeSwitch } from "@/components/ui/headers/header-view-mode-switch";
import { AppSidebarOpenButton } from "@/components/ui/sidebars/app-menu-sidebar";
import { LucideIcon } from "lucide-react";

type HeaderFeatures = {
  navigation?: boolean;
  search?: boolean;
  viewMode?: boolean;
};

interface HeaderProps {
  title: string;
  icon?: LucideIcon;
  basePath?: string;
  features?: HeaderFeatures;
}

export function Header({ title, icon: Icon, basePath, features }: HeaderProps) {
  const { navigation = true, search = true, viewMode = true } = features || {};

  return (
    <header className="sticky top-0 z-30 h-12 border-b bg-white dark:bg-gray-900">
      <div className="flex h-full items-center gap-2 px-2 md:px-3">
        <AppSidebarOpenButton />

        <div className="flex items-center gap-2 mx-2">
          {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
          <span className="text-lg font-semibold hidden md:block">{title}</span>
        </div>

        {navigation && <HeaderNavigation basePath={basePath} />}

        <div className="ml-auto flex items-center gap-2">
          {search && <HeaderSearch />}
          {viewMode && <HeaderViewModeSwitch />}
        </div>
      </div>
    </header>
  );
}
