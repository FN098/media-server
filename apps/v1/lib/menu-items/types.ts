import { MediaNode } from "@/lib/media/types";

type MenuItemVariant = "default" | "destructive";

interface BaseMenuItem<TContext> {
  key: string;
  hidden?: (context: TContext) => boolean;
  disabled?: (context: TContext) => boolean;
  className?: string;
}

interface ActionMenuItem<TContext> extends BaseMenuItem<TContext> {
  type: "action";
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: (context: TContext) => void | Promise<void>;
  variant?: MenuItemVariant;
  kbd?: string | string[];
}

interface GroupMenuItem<
  TContext,
  TItem = MenuItemDef<TContext>,
> extends BaseMenuItem<TContext> {
  type: "group";
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: TItem[]; // 再帰的に自身を呼び出す
}

interface CustomMenuItem<TContext> extends BaseMenuItem<TContext> {
  type: "custom";
  render: (context: TContext) => React.ReactNode;
}

interface SeparatorMenuItem<TContext> extends BaseMenuItem<TContext> {
  type: "separator";
}

export type MenuItemDef<TContext> =
  | ActionMenuItem<TContext>
  | CustomMenuItem<TContext>
  | SeparatorMenuItem<TContext>
  | GroupMenuItem<TContext>;

export type NodeContext = {
  node: MediaNode;
  closeMenu?: () => void;
};

export type MultipleNodesContext = {
  nodes: MediaNode[];
  closeMenu?: () => void;
};

// フィルター用
type WithFilterMeta<TItem, TContext> = TItem & {
  isActive?: (context: TContext) => boolean;
  iconClassName?: string | ((context: TContext) => string | undefined);
  closeOnSelect?: boolean; // default: true
};

export type FilterMenuItem<TContext> =
  | WithFilterMeta<ActionMenuItem<TContext>, TContext>
  | WithFilterMeta<GroupMenuItem<TContext, FilterMenuItem<TContext>>, TContext>
  | CustomMenuItem<TContext>
  | SeparatorMenuItem<TContext>;
