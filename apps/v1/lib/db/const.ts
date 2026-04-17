import { PATHS } from "@/lib/path/paths";
import os from "os";
import path from "path";

export const BACKUP_DIR = PATHS.server.media.db.root;
export const TEMP_BACKUP_DIR = path.join(os.tmpdir(), "media-server", ".db");

export const MIN_KEEP_COUNT = 3;
export const MAX_KEEP_COUNT = 30;
