export type FileType = "text" | "binary" | "image" | "video" | "audio";

export type FsNode =
  | {
      name: string; // ファイル名
      path: string; // ルートからの相対パス
      type: FileType | null;
      isDirectory: false;
      size: number;
      mtime: Date;
    }
  | {
      name: string; // フォルダ名
      path: string; // ルートからの相対パス
      isDirectory: true;
      mtime: Date;
    };

export type FsListing = {
  path: string; // 今見ているディレクトリ
  nodes: FsNode[];
  parentPath: string | null;
  prevPath: string | null;
  nextPath: string | null;
};
