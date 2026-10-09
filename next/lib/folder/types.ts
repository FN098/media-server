export type {
  Folder as DbFolder,
  VisitedFolder as DbVisitedFolder,
} from "@/generated/prisma/client";

export type FolderVisitedInfo = {
  path: string;
  visitedAt: Date | null;
};

export type FolderFavoriteInfo = {
  path: string;
  favoriteMediaCount: number;
  averageRating: number | null;
};

export type FolderMeta = {
  path: string;
  previewPath: string | null;
  title: string | null;
  totalSize: number;
  fileCount: number;
};
