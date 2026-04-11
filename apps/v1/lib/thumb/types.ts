export type GhostThumbItem = {
  path: string;
};

export type GhostThumbScanOptions = {
  fullScan: boolean;
};

export type GhostThumbScanEventData =
  | { type: "progress"; current: number; total: number; found: number }
  | { type: "complete"; items: GhostThumbItem[] }
  | { type: "error"; message: string };

export type GhostThumbScanResult = {
  success: boolean;
  items?: GhostThumbItem[];
  error?: string;
};

export type GhostThumbDeleteResult = {
  success: boolean;
  deletedCount?: number;
  error?: string;
};
