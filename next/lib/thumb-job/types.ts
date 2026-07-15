export interface ThumbJobData {
  type: "file" | "directory";
  path: string;
  createdAt: number; // ジョブのタイムスタンプ
  lockKey: string;
  forceCreate?: boolean;
}

export type ThumbJobCompletedEvent =
  | {
      type: "directory";
      path: string;
    }
  | {
      type: "file";
      path: string;
    };
