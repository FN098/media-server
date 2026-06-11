export type { Media as PrismaMedia } from "@/generated/prisma/client";

export type MediaFsNodeType =
  | "directory"
  | "image"
  | "video"
  | "audio"
  | "file";

export type MediaType = "image" | "video" | "audio";

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

export type MediaNodeTag = {
  name: string;
  id: string;
};

export type MediaNode = MediaFsNode & {
  id?: string;
  title?: string | null;
  lastViewedAt?: Date | null;
  favoriteCount?: number | null;
  averageRating?: number | null;
  tags?: MediaNodeTag[] | null;
  previewPath?: string | null; // サムネイルやプレビュー画像のパス
  rating: number | null; // 1-5の整数 または 未評価 (null)
  isDeleted?: boolean;
  favoritedAt?: Date;
  fileCount?: number;
};

export type MediaListing = {
  path: string; // 今見ているディレクトリ
  nodes: MediaNode[];
  parent: string | null;
  prev: string | null;
  next: string | null;
  total?: number;
};

export type MediaDbNode = {
  id: string;
  path: string;
  title?: string | null;
  fileMtime: Date;
  fileSize?: number | null;
  tags?: MediaNodeTag[] | null;
  rating?: number | null;
  previewPath?: string | null;
  favoritedAt?: Date;
};

export type CachedFsEntry = {
  virtualPath: string;
  name: string;
  isDirectory: boolean;
  isMedia: boolean;
};

export interface MediaFsContext {
  resolveRealPath: (virtualPath: string) => string;
  filterVirtualPath?: (virtualPath: string) => boolean;
  dirCache?: Map<string, CachedFsEntry[]>;
}
