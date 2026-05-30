import { z } from "zod";

export const FsNameSchema = z
  .string()
  .min(1, "名前を入力してください。")
  .max(255, "名前が長すぎます。")
  .refine(
    (name) => !/[\\\/:*?"<>|]/.test(name),
    '使用できない文字が含まれています (\\ / : * ? " < > |)'
  );
