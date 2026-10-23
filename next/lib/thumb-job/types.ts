export interface ThumbJobData {
  type: "file" | "folder";
  id: string;
  createdAt: number; // ジョブのタイムスタンプ
  lockKey: string;
  forceCreate?: boolean;
}

export type ThumbJobCompletedEvent =
  | {
      type: "folder";
      path: string;
    }
  | {
      type: "file";
      path: string;
    };
