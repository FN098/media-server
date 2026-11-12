export const APP_ERROR_CODES = [
  "UNAUTHORIZED",
  "FILE_NOT_FOUND",
  "INVALID_REQUEST",
] as const;

export type AppErrorCode = (typeof APP_ERROR_CODES)[number];
