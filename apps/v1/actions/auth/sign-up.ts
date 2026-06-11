"use server";

import { redirect } from "next/navigation";

import { auth } from "@/lib/auth/better-auth";
import { SignUpFormSchema, SignUpFormState } from "@/lib/auth/schemas";
import { logger } from "@/lib/logger";
import z from "zod";

export async function signUpAction(
  _state: SignUpFormState,
  formData: FormData
): Promise<SignUpFormState> {
  // 入力バリデーション
  const parsed = SignUpFormSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    redirectTo: formData.get("redirectTo"),
  });

  if (!parsed.success) {
    return {
      errors: z.flattenError(parsed.error).fieldErrors,
      message: "入力エラーがあります。",
    };
  }

  const { name, email, password, redirectTo = "/" } = parsed.data;

  // better-auth サーバー API でサインアップ
  try {
    const response = await auth.api.signUpEmail({
      body: { name, email, password },
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
