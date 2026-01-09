import { z } from "zod";

// 名前単体のバリデーション（リネーム用）
export const renameSchema = z.object({
  newName: z
    .string()
    .min(1, "名前を入力してください。")
    .max(255, "名前が長すぎます。")
    .refine(
      (name) => !/[\\\/:*?"<>|]/.test(name),
      '使用できない文字が含まれています (\\ / : * ? " < > |)'
    ),
});

export type RenameInput = z.infer<typeof renameSchema>;
