export type DbBackupFile = {
  name: string;
  label: string;
  createdAt: string;
  size: number; // バイト単位
  isTemp: boolean;
};

export type DbUploadResponse = DbBackupFile & {
  success: boolean;
  error?: string;
};
