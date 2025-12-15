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
      root: "/explorer/",
    },
    experiment: {
      root: "/experiment/",
    },
  },
  api: {
    root: "/api/",
    media: {
      root: "/api/media/",
      thumb: {
        root: "/api/media/.thumb",
      },
    },
  },
} as const;
