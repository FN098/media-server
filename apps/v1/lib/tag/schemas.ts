import { searchTagStrategies } from "@/lib/tag/strategies";
import z from "zod";

const MAX_RETURN_TAGS_COUNT = 100;

export const SearchTagsRequestParamsSchema = z.object({
  query: z.string().optional(),
  paths: z.array(z.string()).optional().default([]),
  ids: z.array(z.string()).optional().default([]),
  strategy: z.enum(searchTagStrategies).optional().default("default"),
  limit: z.coerce.number().optional().default(MAX_RETURN_TAGS_COUNT),
});

export type SearchTagsRequestParamsInput = z.input<
  typeof SearchTagsRequestParamsSchema
>;

export type SearchTagsRequestParams = z.infer<
  typeof SearchTagsRequestParamsSchema
>;
