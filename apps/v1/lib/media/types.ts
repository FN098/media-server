export type { Media as PrismaMedia } from "@/generated/prisma/client";

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

export type MediaNodeTag = {
  name: string;
};

export type MediaNode = MediaFsNode & {
  id?: string;
  title?: string;
  lastViewedAt?: Date;
  favoriteCount?: number;
  tags?: MediaNodeTag[];
  previewPath?: string | null; // サムネイルやプレビュー画像のパス
  rating: number; // 1-5の整数
  isDeleted?: boolean;
  favoritedAt?: Date;
};

export type MediaListing = {
  path: string; // 今見ているディレクトリ
  nodes: MediaNode[];
  parent: string | null;
  prev: string | null;
  next: string | null;
};

export type VirtualMediaNode = {
  id: string;
  path: string;
  title?: string;
  fileMtime: Date;
  fileSize?: number;
  tags?: MediaNodeTag[];
  rating?: number;
  previewPath?: string;
};

export type FolderVisitedInfo = {
  path: string;
  lastViewedAt: Date | null;
};

export type FolderFavoriteInfo = {
  path: string;
  favoriteMediaCount: number;
};

export type FolderMeta = {
  path: string;
  previewPath: string | null;
  title: string | null;
};

export type MediaPathToIndexMap = Map<string, number>;
export type MediaPathToNodeMap = Map<string, MediaNode>;

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

export type GhostMediaScanEventArgs =
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

export type MediaTypeFilterValue = MediaFsNodeType | "all";
