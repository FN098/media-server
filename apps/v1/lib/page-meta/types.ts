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

export type BackgroundType = "default" | "galaxy";

export type PageMetaRaw = {
  key: string;
  title: string;
  url: string;
  icon: LucideIcon;
  accent: AccentColor;
  hidden?: boolean;
  developmentOnly?: boolean;
  backgroundType?: {
    light?: BackgroundType;
    dark?: BackgroundType;
  };
};

export type PageMeta = {
  key: string;
  title: string;
  url: string;
  icon: LucideIcon;
  accent: AccentColor;
  hidden: boolean;
  developmentOnly: boolean;
  backgroundType: {
    light: BackgroundType;
    dark: BackgroundType;
  };
};
