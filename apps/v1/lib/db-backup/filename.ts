export function buildDbBackupFileName(): string {
  const timestamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
  return `media_server_backup_${timestamp}.sql`;
}
