export const statements = [
  "archive:extract",
  "file:rename",
  "file:move",
  "file:copy",
  "file:delete",
  "file:restore",
  "folder:rename",
  "folder:move",
  "folder:copy",
  "folder:delete",
  "folder:restore",
  "folder:update-history",
  "folder:list",
  "folder:list-history",
  "folder:pin-history",
  "folder:create",
] as const;

export type Statement = (typeof statements)[number];
