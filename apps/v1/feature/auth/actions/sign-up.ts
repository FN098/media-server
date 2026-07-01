"use server";

import { redirect } from "next/navigation";

import { SignUpFormSchema, SignUpFormValues } from "@/feature/auth/lib/schemas";
import { SignUpResult } from "@/feature/auth/lib/types";
import { auth } from "@/lib/auth/better-auth";
import { logger } from "@/lib/logger";
import z from "zod";

export async function signUpAction(
  data: SignUpFormValues
): Promise<SignUpResult> {
  // 入力バリデーション
  const parsed = SignUpFormSchema.safeParse(data);

  if (!parsed.success) {
    return {
      ok: false,
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
      return {
        ok: false,
        message: "アカウントの作成に失敗しました。",
      };
    }
  } catch (e) {
    logger.error("action:sign-up", e);

    const message =
      e instanceof Error ? e.message : "予期しないエラーが発生しました。";

    return {
      ok: false,
      message,
    };
  }

  redirect(redirectTo);
}
