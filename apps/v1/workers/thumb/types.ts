export interface ThumbJobData {
  dirPath?: string;
  filePath?: string;
  createdAt: number; // ジョブのタイムスタンプ
}

export interface ThumbCompletedEvent {
  dirPath?: string;
  filePath?: string;
}
