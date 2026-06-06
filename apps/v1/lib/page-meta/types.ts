import { LucideIcon } from "lucide-react";

export type AccentColor =
  | "indigo"
  | "violet"
  | "sky"
  | "cyan"
  | "teal"
  | "emerald"
  | "red"
  | "rose"
  | "orange"
  | "amber"
  | "zinc";

export type PageMetaRaw = {
  key: string;
  title: string;
  url: string;
  icon: LucideIcon;
  accent: AccentColor;
  hidden?: boolean;
  developmentOnly?: boolean;
};

export type PageMeta = {
  key: string;
  title: string;
  url: string;
  icon: LucideIcon;
  accent: AccentColor;
  hidden: boolean;
  developmentOnly: boolean;
};
