import { VisitedFolder } from "@/__lib/folder/types";

export type RecentFolder = VisitedFolder & {
  name: string;
};
