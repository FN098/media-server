export type TagOperator = "add" | "remove";

export type TagOperation = {
  tagId: string;
  operator: TagOperator;
};
