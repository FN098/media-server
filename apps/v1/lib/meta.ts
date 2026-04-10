import { PATHS } from "@/lib/path/paths";
import {
  FolderSearch,
  LayoutDashboard,
  LucideIcon,
  PackageOpen,
  Settings,
  Star,
  Trash2,
  Wrench,
} from "lucide-react";

export type PageMeta = {
  title: string;
  url: string;
  icon: LucideIcon;
};

export const pageMetas = {
  dashboard: {
    title: "Dashboard",
    url: PATHS.client.dashboard.root,
    icon: LayoutDashboard,
  },
  explorer: {
    title: "Explorer",
    url: PATHS.client.explorer.root,
    icon: FolderSearch,
  },
  favorites: {
    title: "Favorites",
    url: PATHS.client.favorites.root,
    icon: Star,
  },
  trash: {
    title: "Trash",
    url: PATHS.client.trash.root,
    icon: Trash2,
  },
  settings: {
    title: "Settings",
    url: PATHS.client.settings.root,
    icon: Settings,
  },
  sandbox: {
    title: "Sandbox",
    url: PATHS.client.sandbox.root,
    icon: PackageOpen,
  },
  maintenance: {
    title: "Maintenance",
    url: PATHS.client.maintenance.root,
    icon: Wrench,
  },
} as const satisfies Record<string, PageMeta>;
