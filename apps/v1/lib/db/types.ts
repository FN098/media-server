export type DbBackupFile = {
  name: string;
  label: string;
  createdAt: string;
  size: number; // バイト単位
  isTemp: boolean;
};

export type DbUploadResponse =
  | {
      success: true;
      backup: DbBackupFile;
    }
  | {
      success: false;
      error: string;
    };
