export type { Media as PrismaMedia } from "@/generated/prisma";

export type MediaFsNodeType =
  | "directory"
  | "image"
  | "video"
  | "audio"
  | "file";

export type MediaFsNode = {
  name: string; // ファイル/フォルダ名
  path: string; // ルートからの相対パス
  type: MediaFsNodeType;
  isDirectory: boolean;
  size?: number; // ディレクトリなら undefined
  mtime: Date;
};

export type MediaFsListing = {
  path: string; // 今見ているディレクトリ
  nodes: MediaFsNode[];
  parent: string | null;
  prev: string | null;
  next: string | null;
};

export type MediaTag = {
  name: string;
};

export type MediaNode = MediaFsNode & {
  id?: string;
  title?: string;
  isFavorite: boolean;
  lastViewedAt?: Date;
  favoriteCount?: number;
  tags?: MediaTag[];
};

export type MediaListing = {
  path: string; // 今見ているディレクトリ
  nodes: MediaNode[];
  parent: string | null;
  prev: string | null;
  next: string | null;
};

export type DbMedia = {
  id: string;
  path: string;
  title?: string;
  isFavorite: boolean;
  fileMtime: Date;
  fileSize?: number;
  tags?: MediaTag[];
};

export type DbVisitedInfo = {
  path: string;
  lastViewedAt: Date | null;
};

export type DbFavoriteInfo = {
  path: string;
  favoriteCountInFolder: number;
};
