export const statements = [
  "archive:extract",
  "file:rename",
  "folder:rename",
  "folder:update-history",
  "folder:list",
  "folder:list-history",
  "folder:pin-history",
  "folder:create",
] as const;

export type Statement = (typeof statements)[number];
