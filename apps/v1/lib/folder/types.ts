export type DbVisitedInfo = {
  path: string;
  lastViewedAt: Date;
};

export type DbFavoriteInfo = {
  path: string;
  favoriteCountInFolder: number;
};
