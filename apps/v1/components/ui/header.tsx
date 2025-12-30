import { AppSidebarOpenButton } from "@/components/ui/app-sidebar";
import { HeaderActions } from "@/components/ui/header-actions";
import { HeaderNavigation } from "@/components/ui/header-navigation";

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

export function Header({ title, basePath, features }: HeaderProps) {
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

        <HeaderActions searchEnabled={search} viewModeEnabled={viewMode} />
      </div>
    </header>
  );
}
