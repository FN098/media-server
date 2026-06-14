import { HeaderNavigation } from "@/feature/header/ui/header-navigation";
import { HeaderSearch } from "@/feature/header/ui/header-search";
import { HeaderViewModeSwitch } from "@/feature/header/ui/header-view-mode-switch";
import { AppSidebarOpenButton } from "@/feature/sidebar/ui/app-menu-sidebar";
import { AccentColor } from "@/lib/page-meta/types";
import { cn } from "@/shadcn/lib/utils";
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
  accent?: AccentColor;
}

const accentBorderMap: Record<AccentColor, string> = {
  indigo: "border-indigo-500/30 dark:border-indigo-500/20",
  violet: "border-violet-500/30 dark:border-violet-500/20",
  sky: "border-sky-500/30    dark:border-sky-500/20",
  cyan: "border-cyan-500/30   dark:border-cyan-500/20",
  teal: "border-teal-500/30   dark:border-teal-500/20",
  emerald: "border-emerald-500/30 dark:border-emerald-500/20",
  red: "border-red-500/30    dark:border-red-500/20",
  rose: "border-rose-500/30   dark:border-rose-500/20",
  orange: "border-orange-500/30 dark:border-orange-500/20",
  amber: "border-amber-500/30  dark:border-amber-500/20",
  zinc: "border-zinc-400/30   dark:border-zinc-500/20",
};

const accentIconMap: Record<AccentColor, string> = {
  indigo: "text-indigo-500 dark:text-indigo-400",
  violet: "text-violet-500 dark:text-violet-400",
  sky: "text-sky-500    dark:text-sky-400",
  cyan: "text-cyan-500   dark:text-cyan-400",
  teal: "text-teal-500   dark:text-teal-400",
  emerald: "text-emerald-500 dark:text-emerald-400",
  red: "text-red-500    dark:text-red-400",
  rose: "text-rose-500   dark:text-rose-400",
  orange: "text-orange-500 dark:text-orange-400",
  amber: "text-amber-500  dark:text-amber-400",
  zinc: "text-zinc-500   dark:text-zinc-400",
};

export function Header({
  title,
  icon: Icon,
  basePath,
  features,
  accent,
}: HeaderProps) {
  const { navigation = true, search = true, viewMode = true } = features || {};

  return (
    <header
      className={cn(
        "sticky top-0 z-30 h-12 border-b",
        "backdrop-blur-md",
        accent
          ? accentBorderMap[accent]
          : "border-zinc-200 dark:border-white/[0.06]"
      )}
    >
      <div
        className="grid h-full items-center gap-2 px-2 md:px-3"
        style={{ gridTemplateColumns: "auto auto 1fr auto" }}
      >
        {/* メニュー開閉ボタン */}
        <AppSidebarOpenButton />

        {/* アイコン＋タイトル */}
        <div className="flex items-center gap-2 mx-2">
          {Icon && (
            <Icon
              className={cn(
                "w-5 h-5 flex-shrink-0",
                accent
                  ? accentIconMap[accent]
                  : "text-zinc-500 dark:text-zinc-400"
              )}
            />
          )}
          <span className="text-lg font-semibold hidden md:block text-zinc-800 dark:text-zinc-100">
            {title}
          </span>
        </div>

        {/* パンくず */}
        <div className="min-w-0">
          {navigation && <HeaderNavigation basePath={basePath} />}
        </div>

        {/* 検索＋ビューモード */}
        <div className="flex items-center gap-2">
          {search && <HeaderSearch />}
          {viewMode && <HeaderViewModeSwitch />}
        </div>
      </div>
    </header>
  );
}
