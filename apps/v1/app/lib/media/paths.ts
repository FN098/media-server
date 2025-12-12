const MEDIA_ROOT = process.env.MEDIA_ROOT!;

export const PATHS = {
  server: {
    mediaRoot: MEDIA_ROOT,
    thumbRoot: `${MEDIA_ROOT}/.thumb/`,
  },
  client: {
    explorer: "/dashboard/explorer/",
  },
  api: {
    mediaRoot: `/api/media/`,
    thumbRoot: `/api/media/.thumb/`,
  },
} as const;
