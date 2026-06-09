import { PageMetaRaw } from "@/lib/page-meta/types";
import { PATHS } from "@/lib/path/paths";
import {
  FolderSearchIcon,
  LayoutDashboardIcon,
  PackageOpenIcon,
  SettingsIcon,
  StarIcon,
  Trash2Icon,
  UserIcon,
  WrenchIcon,
} from "lucide-react";

export const pageMetas = [
  {
    key: "dashboard",
    title: "Dashboard",
    url: PATHS.client.dashboard.root,
    icon: LayoutDashboardIcon,
    accent: "indigo",
    backgroundType: "galaxy",
  },
  {
    key: "explorer",
    title: "Explorer",
    url: PATHS.client.explorer.root,
    icon: FolderSearchIcon,
    accent: "sky",
    backgroundType: "galaxy",
  },
  {
    key: "favorites",
    title: "Favorites",
    url: PATHS.client.favorites.root,
    icon: StarIcon,
    accent: "amber",
    backgroundType: "galaxy",
  },
  {
    key: "trash",
    title: "Trash",
    url: PATHS.client.trash.root,
    icon: Trash2Icon,
    accent: "red",
    backgroundType: "galaxy",
  },
  {
    key: "settings",
    title: "Settings",
    url: PATHS.client.settings.root,
    icon: SettingsIcon,
    hidden: true,
    accent: "orange",
    backgroundType: "galaxy",
  },
  {
    key: "sandbox",
    title: "Sandbox",
    url: PATHS.client.sandbox.root,
    icon: PackageOpenIcon,
    developmentOnly: true,
    accent: "teal",
    backgroundType: "galaxy",
  },
  {
    key: "maintenance",
    title: "Maintenance",
    url: PATHS.client.maintenance.root,
    icon: WrenchIcon,
    accent: "zinc",
    backgroundType: "galaxy",
  },
  {
    key: "sign-in",
    title: "Sign in",
    url: PATHS.client.signIn.root,
    icon: UserIcon,
    accent: "indigo",
    backgroundType: "galaxy",
  },
  {
    key: "sign-up",
    title: "Sign up",
    url: PATHS.client.signUp.root,
    icon: UserIcon,
    accent: "violet",
    backgroundType: "galaxy",
  },
] as const satisfies readonly PageMetaRaw[];

export type PageMetaKey = (typeof pageMetas)[number]["key"];
