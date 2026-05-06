import { MediaNode } from "@/lib/media/types";

export type MenuItemVariant = "default" | "destructive";

interface BaseMenuItem {
  key: string;
  hidden?: (node: MediaNode) => boolean;
  disabled?: (node: MediaNode) => boolean;
}

export interface ActionMenuItem extends BaseMenuItem {
  type: "action";
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: (node: MediaNode) => void | Promise<void>;
  variant?: MenuItemVariant;
  kbd?: string;
}

export interface CustomMenuItem extends BaseMenuItem {
  type: "custom";
  render: (node: MediaNode) => React.ReactNode;
}

export type MenuItemDef = ActionMenuItem | CustomMenuItem;
