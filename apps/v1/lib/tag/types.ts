import { searchTagStrategies, sortTagStrategies } from "@/lib/tag/strategies";

export type {
  MediaTag as PrismaMediaTag,
  Tag as PrismaTag,
} from "@/generated/prisma/client";

export type Tag = {
  id: string;
  name: string;
};

export type TagNameType = string;

export type TagOperator = "add" | "remove";
export type TagOperation = {
  tagId: string;
  operator: TagOperator;
};

export type TagState = "all" | "some" | "none";
export type TagStates = Record<TagNameType, TagState>;
export type TagCounts = Record<TagNameType, number>;

export type PendingNewTag = {
  tempId: string;
  name: string;
};

export type CreateTagsResult =
  | {
      success: true;
      tags: Tag[];
    }
  | {
      success: false;
      error: string;
    };

export type SearchTagStrategy = (typeof searchTagStrategies)[number];
export type SearchTagsOptions = {
  excludeIds?: string[];
  limit?: number;
  query?: string;
  strategy?: SearchTagStrategy;
};
export type SearchTagsRequestParams = {
  paths?: string[];
  limit?: number;
  query?: string;
  strategy?: SearchTagStrategy;
};

export type SortTagStrategy = (typeof sortTagStrategies)[number];

export type PendingChanges = Record<string, TagOperator>;

export type UnusedTagItem = {
  id: string;
  name: string;
  usageCount: number;
};

export type UnusedTagScanResult = {
  success: boolean;
  tags?: UnusedTagItem[];
  error?: string;
};

export type UnusedTagDeleteResult = {
  success: boolean;
  deletedCount?: number;
  error?: string;
};
