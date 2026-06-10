import { SearchTagStrategy } from "@/lib/tag/strategies";

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

export type SearchTagsOptions = {
  excludeIds?: string[];
  limit?: number;
  query?: string;
  strategy?: SearchTagStrategy;
};

export type SearchTagsRequestParams = {
  paths?: string[];
  ids?: string[];
  limit?: number;
  query?: string;
  strategy?: SearchTagStrategy;
};

export type TagMasterItem = {
  id: string;
  name: string;
  kana: string | null;
  isFavorite: boolean;
  isNew: boolean;
  _count: { mediaTags: number };
};
