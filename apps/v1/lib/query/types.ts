import { ExplorerQuerySchema } from "@/lib/query/schemas";
import z from "zod";

export type ViewMode = "list" | "grid";

export type IndexLike = number | "first" | "last";

export type SetExplorerQueryOptions = {
  history?: "replace" | "push";
};

export type ExplorerQuery = z.infer<typeof ExplorerQuerySchema>;
