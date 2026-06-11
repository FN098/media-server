"use server";

import { redirect } from "next/navigation";

import { auth } from "@/lib/auth/better-auth";
import { SignInFormSchema, SignInFormState } from "@/lib/auth/schemas";
import { logger } from "@/lib/logger";
import z from "zod";

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
    };
  }

  const { email, password, rememberMe, redirectTo = "/" } = parsed.data;

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

    // better-auth は認証失敗時に APIError をスローする
    const message =
      e instanceof Error ? e.message : "予期しないエラーが発生しました。";

    return { message };
  }

  redirect(redirectTo);
}
