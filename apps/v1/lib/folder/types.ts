export type FolderVisitedInfo = {
  path: string;
  lastViewedAt: Date | null;
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
