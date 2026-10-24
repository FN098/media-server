import { VisitedFolder } from "@/lib/folder/types";

export type RecentFolder = VisitedFolder & {
  name: string;
};
