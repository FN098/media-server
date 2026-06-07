export const statements = ["archive.extract"] as const;

export type Statement = (typeof statements)[number];
