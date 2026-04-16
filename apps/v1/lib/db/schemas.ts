import { z } from "zod";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ACCEPTED_EXTENSIONS = [".sql"];

export const dbUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= MAX_FILE_SIZE, `最大サイズは 50MB です`)
    .refine(
      (file) => ACCEPTED_EXTENSIONS.some((ext) => file.name.endsWith(ext)),
      ".sql ファイルのみアップロード可能です"
    ),
});
