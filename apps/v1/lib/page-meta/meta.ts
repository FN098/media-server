import { PATHS } from "@/lib/path/paths";
import {
  FolderSearchIcon,
  LayoutDashboardIcon,
  LucideIcon,
  PackageOpenIcon,
  SettingsIcon,
  StarIcon,
  Trash2Icon,
  WrenchIcon,
} from "lucide-react";

export type PageMetaRaw = {
  key: string;
  title: string;
  url: string;
  icon: LucideIcon;
  hidden?: boolean;
  developmentOnly?: boolean;
};

export type PageMeta = {
  key: string;
  title: string;
  url: string;
  icon: LucideIcon;
  hidden: boolean;
  developmentOnly: boolean;
};

export const pageMetas = [
  {
    key: "dashboard",
    title: "Dashboard",
    url: PATHS.client.dashboard.root,
    icon: LayoutDashboardIcon,
  },
  {
    key: "explorer",
    title: "Explorer",
    url: PATHS.client.explorer.root,
    icon: FolderSearchIcon,
  },
  {
    key: "favorites",
    title: "Favorites",
    url: PATHS.client.favorites.root,
    icon: StarIcon,
  },
  {
    key: "trash",
    title: "Trash",
    url: PATHS.client.trash.root,
    icon: Trash2Icon,
  },
  {
    key: "settings",
    title: "Settings",
    url: PATHS.client.settings.root,
    icon: SettingsIcon,
    hidden: true,
  },
  {
    key: "sandbox",
    title: "Sandbox",
    url: PATHS.client.sandbox.root,
    icon: PackageOpenIcon,
    developmentOnly: true,
  },
  {
    key: "maintenance",
    title: "Maintenance",
    url: PATHS.client.maintenance.root,
    icon: WrenchIcon,
  },
] as const satisfies readonly PageMetaRaw[];

export type PageMetaKey = (typeof pageMetas)[number]["key"];
