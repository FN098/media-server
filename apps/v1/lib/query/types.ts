import { ExplorerQuerySchema } from "@/lib/query/validation";
import z from "zod";

export type ViewMode = "list" | "grid";

export type IndexLike = number | "first" | "last";

export type SetExplorerQueryOptions = {
  history?: "replace" | "push";
  path?: string;
};

export type ExplorerQuery = z.infer<typeof ExplorerQuerySchema>;
