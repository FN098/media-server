import type { Tag } from "@/generated/prisma";

export type TagOperator = "add" | "remove";

export type TagOperation = {
  tagId: string;
  operator: TagOperator;
};

export type TagEditMode = "default" | "single" | "none";

export type TagState = "all" | "some" | "none";

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

export type { Tag };
