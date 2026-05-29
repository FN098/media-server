export type GhostMediaItem = {
  id: string;
  title: string | null;
  path: string;
};

export type GhostMediaScanOptions = {
  fullScan: boolean;
};

export type GhostMediaScanEventData =
  | { type: "progress"; current: number; total: number; found: number }
  | { type: "complete"; items: GhostMediaItem[] }
  | { type: "error"; message: string };

export type GhostMediaScanResult = {
  success: boolean;
  items?: GhostMediaItem[];
  error?: string;
};

export type GhostMediaDeleteResult = {
  success: boolean;
  deletedCount?: number;
  error?: string;
};
