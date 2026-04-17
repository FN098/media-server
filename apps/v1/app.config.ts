export const APP_CONFIG = {
  thumb: {
    extension: ".webp",
  },
  meta: {
    title: "Media Server",
    description: "ローカルファイルをWEBブラウザで管理します。",
  },
  dbDump: {
    maxFileSize: 50 * 1024 * 1024, // 50MB
  },
  favorites: {
    maxPageSize: 1000,
  },
} as const;
