export type FsNodeType = "folder" | "file";

export type FsFileType = "binary" | "text" | "image" | "video" | "audio";

export type FsFileNode = {
  path: string;
  name: string;
  type: "file";
  size: number;
  mtime: Date;
};

export type FsFolderNode = {
  path: string;
  name: string;
  type: "folder";
};

export type FsNode = FsFileNode | FsFolderNode;

export type FsNodeListing = {
  path: string;
  parent: string;
  prev: string;
  next: string;
  name: string;
  children: FsNode[];
};
