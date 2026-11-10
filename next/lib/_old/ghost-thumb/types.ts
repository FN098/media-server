export type GhostThumbItem = {
  path: string;
  isDirectory?: boolean;
};

export type GhostThumbScanEventData =
  | { type: "progress"; current: number; total: number; found: number }
  | { type: "complete"; items: GhostThumbItem[] }
  | { type: "error"; message: string };
