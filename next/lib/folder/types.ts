import type { VisitedFolder } from "@/generated/prisma/client";
export type { Folder, VisitedFolder } from "@/generated/prisma/client";

export type VisitedFolderInfo = VisitedFolder & {
  name: string;
};
