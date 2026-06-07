import { MAX_UPLOAD_FILE_SIZE } from "@/lib/db-backup/config";
import { formatBytes } from "@/lib/utils/bytes";
import { FileNameSchema } from "@/lib/virtual-path/schemas";
import z from "zod";

// セキュリティ対策: ファイル名にスラッシュ等が含まれないかチェック（ディレクトリトラバーサル防止）
export const DownloadRequestSchema = z.object({
  file: FileNameSchema.refine((name) => !name.includes("/"), {
    message: "Path separators are not allowed",
  })
    .refine((name) => !name.includes(".."), {
      message: "Parent directory references are not allowed",
    })
    .refine((name) => name.endsWith(".sql"), {
      message: "Must be a .sql file",
    }),
});

export const UploadRequestSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= MAX_UPLOAD_FILE_SIZE, {
      message: `File size must not exceed ${formatBytes(MAX_UPLOAD_FILE_SIZE)}`,
    })
    .refine((file) => file.name.endsWith(".sql"), {
      message: "Must be a .sql file",
    }),
});
