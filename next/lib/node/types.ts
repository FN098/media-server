export type NodeType = "folder" | "file";

export type FileType = "binary" | "text" | "image" | "video" | "audio";

export type FileTag = {
  id: string;
  name: string;
};

export type FileNode = {
  id: string;
  parentFolderId: string | null;
  previewFileId: string | null;
  name: string;
  type: "file";
  size: number;
  mtime: Date;
  tags: FileTag[];
  rating: number | null; // 1-5の整数 または 未評価 (null)
  deletedAt: Date | null;
  favoritedAt: Date | null;
};

export type FolderNode = {
  id: string;
  parentFolderId: string | null;
  previewFileId: string | null;
  name: string;
  type: "folder";
  size: number | null;
  mtime: Date | null;
  fileCount: number | null;
  favoriteFileCount: number | null;
  averageFileRating: number | null;
  deletedAt: Date | null;
};

export type Node = FileNode | FolderNode;

export type NodeListing = {
  title: string;
  url: string;
  children: Node[];
  parentUrl: string | null;
  prevUrl: string | null;
  nextUrl: string | null;
};
