const MEDIA_ROOT = process.env.MEDIA_ROOT!;

export const PATHS = {
  server: {
    media: {
      root: MEDIA_ROOT,
      thumb: {
        root: `${MEDIA_ROOT}/.thumb/`,
      },
    },
  },
  client: {
    dashboard: {
      root: "/",
    },
    explorer: {
      root: "/explorer",
    },
    experimental: {
      root: "/experimental",
    },
  },
  api: {
    root: "/api",
    media: {
      root: "/api/media",
      file: {
        root: "/api/media/file",
        thumb: {
          root: "/api/media/file/.thumb",
        },
      },
    },
  },
} as const;
