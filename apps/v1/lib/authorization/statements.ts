export const statements = [
  "archive:extract",
  "folder:visit",
  "folder:create",
] as const;

export type Statement = (typeof statements)[number];
