import { AccentColor } from "@/app/(pages)/_lib/accent-color";
import { PATHS } from "@/lib/path/paths";
import {
  FolderSearchIcon,
  LayoutDashboardIcon,
  LucideIcon,
  SettingsIcon,
  StarIcon,
  Trash2Icon,
  UserIcon,
  WrenchIcon,
} from "lucide-react";

export type PageMeta = {
  key: string;
  title: string;
  url: string;
  icon: LucideIcon;
  accent: AccentColor;
};

export const pageMetas = [
  {
    key: "dashboard",
    title: "Dashboard",
    url: PATHS.client.dashboard.root,
    icon: LayoutDashboardIcon,
    accent: "indigo",
  },
  {
    key: "explorer",
    title: "Explorer",
    url: PATHS.client.explorer.root,
    icon: FolderSearchIcon,
    accent: "sky",
  },
  {
    key: "favorites",
    title: "Favorites",
    url: PATHS.client.favorites.root,
    icon: StarIcon,
    accent: "amber",
  },
  {
    key: "trash",
    title: "Trash",
    url: PATHS.client.trash.root,
    icon: Trash2Icon,
    accent: "red",
  },
  {
    key: "settings",
    title: "Settings",
    url: PATHS.client.settings.root,
    icon: SettingsIcon,
    accent: "orange",
  },
  {
    key: "maintenance",
    title: "Maintenance",
    url: PATHS.client.maintenance.root,
    icon: WrenchIcon,
    accent: "zinc",
  },
  {
    key: "sign-in",
    title: "Sign in",
    url: PATHS.client.signIn.root,
    icon: UserIcon,
    accent: "indigo",
  },
  {
    key: "sign-up",
    title: "Sign up",
    url: PATHS.client.signUp.root,
    icon: UserIcon,
    accent: "violet",
  },
] as const satisfies PageMeta[];

const pageMetaMap = new Map(pageMetas.map((meta) => [meta.key, meta]));

export function getPageMeta(key: PageMetaKey): PageMeta | null {
  return pageMetaMap.get(key) ?? null;
}

export type PageMetaKey = (typeof pageMetas)[number]["key"];
