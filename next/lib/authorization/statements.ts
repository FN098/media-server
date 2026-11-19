import { assertUnique } from "@/lib/utils/assert-unique";

export const statements = assertUnique([
  "list-sub-folders",
  "refresh-sub-folders",
  "list-recent-folders",
  "download-file",
  "move-many-files-or-folders",
  "toggle-pin-visited-folder",
  "visit-folder",
  "create-many-tags",
  "get-tags-infinite",
  "delete-many-tags",
  "delete-tag",
  "find-many-files",
  "mark-tag-as-read",
  "rename-tag",
  "create-many-file-tags",
  "delete-many-file-tags",
  "delete-unused-tags",
] as const);

export type Statement = (typeof statements)[number];
