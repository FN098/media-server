import { MediaNode } from "@/lib/media/types";

export type MenuItemVariant = "default" | "destructive";

interface BaseMenuItem<T> {
  key: string;
  hidden?: (context: T) => boolean;
  disabled?: (context: T) => boolean;
  className?: string;
}

export interface ActionMenuItem<T> extends BaseMenuItem<T> {
  type: "action";
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: (context: T) => void | Promise<void>;
  variant?: MenuItemVariant;
  kbd?: string;
}

export interface CustomMenuItem<T> extends BaseMenuItem<T> {
  type: "custom";
  render: (context: T) => React.ReactNode;
}

export interface SeparatorMenuItem<T> extends BaseMenuItem<T> {
  type: "separator";
}

export type MenuItemDef<T> =
  | ActionMenuItem<T>
  | CustomMenuItem<T>
  | SeparatorMenuItem<T>;

export type NodeContext = {
  node: MediaNode;
  closeMenu?: () => void;
};

export type MultipleNodesContext = {
  nodes: MediaNode[];
  closeMenu?: () => void;
};
