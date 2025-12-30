export type DbVisitedInfo = {
  path: string;
  lastViewedAt: Date | null;
};

export type DbFavoriteInfo = {
  path: string;
  favoriteCountInFolder: number;
};
