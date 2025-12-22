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
  size?: number;
  mtime: string;
};

export type MediaFsListing = {
  path: string; // 今見ているディレクトリ
  nodes: MediaFsNode[];
  parent: string | null;
};
