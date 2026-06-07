export const statements = [
  "archive:extract",
  "file:rename",
  "file:move",
  "folder:rename",
  "folder:move",
  "folder:update-history",
  "folder:list",
  "folder:list-history",
  "folder:pin-history",
  "folder:create",
] as const;

export type Statement = (typeof statements)[number];
