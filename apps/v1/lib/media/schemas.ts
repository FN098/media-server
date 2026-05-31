import { z } from "zod";

// schema.prisma の Media 定義相当
export const MediaSchema = z.object({
  id: z.uuidv7(),
  path: z.string(),
  dirPath: z.string(),
  previewPath: z.string().nullable(),
  tile: z.string().nullable(),
  fileMtime: z.date(),
  fileSize: z.bigint().nullable(),
  type: z.enum(["video", "audio", "image"]).nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/** @deprecated use FileNameSchema instead */
export const FsNameSchema = z
  .string()
  .min(1, "名前を入力してください。")
  .max(255, "名前が長すぎます。")
  .refine(
    (name) => !/[\\\/:*?"<>|]/.test(name),
    '使用できない文字が含まれています (\\ / : * ? " < > |)'
  );
