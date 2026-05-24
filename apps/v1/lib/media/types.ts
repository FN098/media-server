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

export type SortDirection = "asc" | "desc";

export type SortOptions<T> = {
  key?: keyof T;
  direction?: SortDirection;
  valueMapper?: (node: T, key: keyof T) => unknown;
};

export type SortKeyOf<T> = SortOptions<T>["key"];

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

export type MediaNodeFilter = (node: MediaNode) => boolean;

export interface MediaFsContext {
  /** 物理ルートパスの解決関数 */
  resolveRealPath: (virtualPath: string) => string;

  /** 仮想パスのフィルタリング関数（ブラックリストなど） */
  filterVirtualPath?: (virtualPath: string) => boolean;
}

export type GhostMediaItem = {
  id: string;
  title: string | null;
  path: string;
};

export type GhostMediaScanOptions = {
  fullScan: boolean;
};

export type GhostMediaScanEventData =
  | { type: "progress"; current: number; total: number; found: number }
  | { type: "complete"; items: GhostMediaItem[] }
  | { type: "error"; message: string };

export type GhostMediaScanResult = {
  success: boolean;
  items?: GhostMediaItem[];
  error?: string;
};

export type GhostMediaDeleteResult = {
  success: boolean;
  deletedCount?: number;
  error?: string;
};
