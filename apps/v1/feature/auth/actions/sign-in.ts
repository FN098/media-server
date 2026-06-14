"use server";

import { auth } from "@/lib/auth/better-auth";
import { logger } from "@/lib/logger";
import { redirect } from "next/navigation";
import z from "zod";

const SignInFormSchema = z.object({
  email: z
    .email({ message: "有効なメールアドレスを入力してください。" })
    .trim(),

  password: z
    .string()
    .min(1, { message: "パスワードを入力してください。" })
    .trim(),

  rememberMe: z.boolean().optional(),

  redirectTo: z.string().optional().default("/"),
});

type SignInFormState =
  | {
      errors?: {
        email?: string[];
        password?: string[];
      };
      message?: string;
    }
  | undefined;

export async function signInAction(
  _state: SignInFormState,
  formData: FormData
): Promise<SignInFormState> {
  // 入力バリデーション
  const parsed = SignInFormSchema.safeParse({
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

  const { email, password, rememberMe, redirectTo } = parsed.data;

  // better-auth サーバー API でサインイン
  try {
    const response = await auth.api.signInEmail({
      body: { email, password, rememberMe },
    });

    if (!response) {
      return { message: "サインインに失敗しました。" };
    }
  } catch (e) {
    logger.error("action:sign-in", e);

    const message =
      e instanceof Error ? e.message : "予期しないエラーが発生しました。";

    return { message };
  }

  redirect(redirectTo);
}
