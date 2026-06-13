"use server";

import { redirect } from "next/navigation";

import { auth } from "@/lib/auth/better-auth";
import { logger } from "@/lib/logger";
import z from "zod";

const SignUpFormSchema = z.object({
  name: z
    .string()
    .min(2, { message: "名前は2文字以上で入力してください。" })
    .trim(),

  email: z
    .email({ message: "有効なメールアドレスを入力してください。" })
    .trim(),

  password: z
    .string()
    .min(8, { message: "8文字以上で入力してください。" })
    .regex(/[a-zA-Z]/, { message: "英字を1文字以上含めてください。" })
    .regex(/[0-9]/, { message: "数字を1文字以上含めてください。" }),

  rememberMe: z.boolean().optional(),

  redirectTo: z.string().optional().default("/"),
});

type SignUpFormState =
  | {
      errors?: {
        name?: string[];
        email?: string[];
        password?: string[];
      };
      message?: string;
    }
  | undefined;

export async function signUpAction(
  _state: SignUpFormState,
  formData: FormData
): Promise<SignUpFormState> {
  // 入力バリデーション
  const parsed = SignUpFormSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    rememberMe: formData.get("rememberMe") === "on",
    redirectTo: formData.get("redirectTo"),
  });

  if (!parsed.success) {
    return {
      errors: z.flattenError(parsed.error).fieldErrors,
      message: "入力エラーがあります。",
    };
  }

  const { name, email, password, rememberMe, redirectTo } = parsed.data;

  // better-auth サーバー API でサインアップ
  try {
    const response = await auth.api.signUpEmail({
      body: { name, email, password, rememberMe },
    });

    if (!response) {
      return { message: "アカウントの作成に失敗しました。" };
    }
  } catch (e) {
    logger.error("action:sign-up", e);

    const message =
      e instanceof Error ? e.message : "予期しないエラーが発生しました。";

    return { message };
  }

  redirect(redirectTo);
}
