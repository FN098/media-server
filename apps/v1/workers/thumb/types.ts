export interface ThumbJobData {
  dirPath?: string;
  filePath?: string;
  createdAt: number; // ジョブのタイムスタンプ
  lockKey: string;
  forceCreate?: boolean;
}

export interface ThumbCompletedEvent {
  dirPath?: string;
  filePath?: string;
}
