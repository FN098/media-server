export interface ThumbJobData {
  dirPath?: string;
  filePath?: string;
  createdAt: number; // ジョブのタイムスタンプ
  lockKey: string;
}

export interface ThumbCompletedEvent {
  dirPath?: string;
  filePath?: string;
}
