import { v4 } from "uuid";

export function buildDbBackupFileName(): string {
  const timestamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
  return `media_server_backup_${timestamp}.sql`;
}

export function buildDbUploadFileName(): string {
  return `media_server_upload_${v4()}.sql`;
}
