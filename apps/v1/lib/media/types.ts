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
};

export type MediaNode = MediaFsNode & {
  title?: string;
  isFavorite: boolean;
};

export type MediaListing = {
  path: string; // 今見ているディレクトリ
  nodes: MediaNode[];
  parent: string | null;
};

export type DbMedia = {
  path: string;
  title?: string;
  isFavorite: boolean;
  fileMtime: Date;
  fileSize?: number;
};
