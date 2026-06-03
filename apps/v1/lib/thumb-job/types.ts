export interface ThumbJobData {
  dirPath?: string;
  filePath?: string;
  createdAt: number; // ジョブのタイムスタンプ
  lockKey: string;
  forceCreate?: boolean;
}

export interface ThumbJobCompletedEvent {
  dirPath?: string;
  filePath?: string;
}
