const MEDIA_ROOT = process.env.MEDIA_ROOT ?? "media";

export const PATHS = {
  server: {
    media: {
      root: MEDIA_ROOT,
      thumb: {
        root: `${MEDIA_ROOT}/.thumb`,
      },
      trash: {
        root: `${MEDIA_ROOT}/.trash`,
      },
    },
  },
  virtual: {
    trash: {
      root: ".trash",
    },
  },
  client: {
    dashboard: {
      root: "/",
    },
    explorer: {
      root: "/explorer",
    },
    sandbox: {
      root: "/sandbox",
    },
    favorites: {
      root: "/favorites",
    },
    settings: {
      root: "/settings",
    },
    trash: {
      root: "/trash",
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
    thumb: {
      root: "/api/thumb",
      events: {
        root: "/api/thumb/events",
      },
    },
  },
} as const;
