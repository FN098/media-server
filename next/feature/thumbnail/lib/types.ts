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
      id: string;
    }
  | {
      type: "file";
      id: string;
    };
