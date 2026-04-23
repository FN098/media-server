import { PATHS } from "@/lib/path/paths";
import os from "os";
import path from "path";

export const DB_BACKUP_DIR = PATHS.server.media.db.root;
export const TEMP_DB_BACKUP_DIR = path.join(os.tmpdir(), "media-server", ".db");

export const MIN_KEEP_COUNT = 3;
export const MAX_KEEP_COUNT = 30;

export type DbBackupFile = {
  name: string;
  label: string;
  createdAt: string;
  size: number; // バイト単位
  isTemp: boolean;
};

export type DbUploadResult =
  | {
      success: true;
      backup: DbBackupFile;
    }
  | {
      success: false;
      error: string;
    };
