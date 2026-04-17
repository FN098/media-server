import { APP_CONFIG } from "@/app.config";
import { formatBytes } from "@/lib/utils/formatter";
import { z } from "zod";

const MAX_FILE_SIZE = APP_CONFIG.dbDump.maxFileSize;

export const dbUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine(
      (file) => file.size <= MAX_FILE_SIZE,
      `最大サイズは ${formatBytes(MAX_FILE_SIZE)} です`
    )
    .refine(
      (file) => [".sql"].some((ext) => file.name.endsWith(ext)),
      ".sql ファイルのみアップロード可能です"
    ),
});
