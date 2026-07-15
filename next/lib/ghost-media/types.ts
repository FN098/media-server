export type GhostMediaItem = {
  id: string;
  title: string | null;
  path: string;
};

export type GhostMediaScanEventData =
  | { type: "progress"; current: number; total: number; found: number }
  | { type: "complete"; items: GhostMediaItem[] }
  | { type: "error"; message: string };
