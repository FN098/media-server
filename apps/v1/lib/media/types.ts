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

export type DbMedia = {
  id: string;
  path: string;
  title?: string;
  fileMtime: Date;
  fileSize?: number;
  tags?: MediaNodeTag[];
  rating?: number;
};

export type DbVisitedInfo = {
  path: string;
  lastViewedAt: Date | null;
};

export type DbFavoriteInfo = {
  path: string;
  favoriteCountInFolder: number;
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

export type DbFolderMeta = {
  path: string;
  previewPath: string | null;
};
