"use server";

import { auth } from "@/__lib/auth/better-auth";
import { logger } from "@/__lib/logger";
import {
  SignInFormSchema,
  SignInFormValues,
} from "@/feature/auth/sign-in/lib/schemas";
import { SignInResult } from "@/feature/auth/sign-in/lib/types";
import { redirect } from "next/navigation";
import z from "zod";

export async function signInAction(
  data: SignInFormValues
): Promise<SignInResult> {
  // 入力バリデーション
  const parsed = SignInFormSchema.safeParse(data);

  if (!parsed.success) {
    return {
      ok: false,
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
      return { ok: false, message: "サインインに失敗しました。" };
    }
  } catch (e) {
    logger.error("action:sign-in", e);

    const message =
      e instanceof Error ? e.message : "予期しないエラーが発生しました。";

    return { ok: false, message };
  }

  redirect(redirectTo);
}
