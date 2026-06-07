export const statements = [
  "archive:extract",
  "folder:update-history",
  "folder:list",
  "folder:list-history",
  "folder:pin-history",
  "folder:create",
] as const;

export type Statement = (typeof statements)[number];
