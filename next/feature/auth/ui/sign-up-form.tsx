/* eslint-disable @typescript-eslint/no-misused-promises */
"use client";

import {
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  MailIcon,
  ShieldAlertIcon,
  UserIcon,
} from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";

import { signUpAction } from "@/feature/auth/actions/sign-up";
import { SignUpFormSchema, SignUpFormValues } from "@/feature/auth/lib/schemas";
import { SignInResult } from "@/feature/auth/lib/types";
import { entries } from "@/lib/utils/object";
import { Button } from "@/shadcn/components/ui/button";
import { Field, FieldLabel } from "@/shadcn/components/ui/field";
import { Input } from "@/shadcn/components/ui/input";
import { Spinner } from "@/shadcn/components/ui/spinner";
import { cn } from "@/shadcn/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

interface SignUpFormProps {
  hasAdmin: boolean;
  redirectTo?: string;
}

export function SignUpForm({ hasAdmin, redirectTo }: SignUpFormProps) {
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);

  const {
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(SignUpFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      rememberMe: false,
      redirectTo: redirectTo,
    },
  });

  const onSubmit = (data: SignUpFormValues) => {
    startTransition(async () => {
      const result = await signUpAction(data);
      if (!result.ok) {
        onError(result);
      }
    });
  };

  const onError = (result: SignInResult) => {
    setError("form", { message: result.message });

    if (result.errors) {
      entries(result.errors).forEach(([field, messages]) => {
        if (!messages || messages.length === 0) return;
        setError(field, {
          message: messages[0],
        });
      });
    }
  };

  return (
    <div className="relative w-full max-w-sm mx-4">
      <div className="absolute -top-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-violet-500/60 dark:via-violet-500 to-transparent" />

      <div className="rounded-2xl border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.03] backdrop-blur-xl shadow-xl shadow-zinc-200/50 dark:shadow-2xl dark:shadow-black/50">
        <div className="px-8 pt-8 pb-2">
          <div className="mb-8">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 border border-violet-200 dark:bg-violet-500/20 dark:border-violet-500/30">
                <div className="h-2.5 w-2.5 rounded-sm bg-violet-500 dark:bg-violet-400" />
              </div>
              <span className="text-xs font-medium tracking-widest text-zinc-400 dark:text-zinc-500 uppercase">
                Media Server
              </span>
            </div>
            <h1 className="mt-4 text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
              Create account
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              アカウントを作成してください
            </p>
          </div>

          {/* 管理者バナー */}
          {!hasAdmin && (
            <div className="flex items-start gap-2.5 rounded-lg border border-amber-300/60 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/10 px-3 py-2.5 mb-6">
              <ShieldAlertIcon
                className="mt-px h-4 w-4 shrink-0 text-amber-500"
                aria-hidden
              />
              <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-400/90">
                システムに管理者が存在しません。最初のユーザーは自動的に
                <span className="font-medium text-amber-600 dark:text-amber-300">
                  {" "}
                  Admin{" "}
                </span>
                となります。
              </p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-8 pb-8 space-y-5">
          <input type="hidden" name="redirectTo" value={redirectTo} />

          {/* Name */}
          <Controller
            name="name"
            control={control}
            disabled={isPending}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                <div className="relative">
                  <UserIcon
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-600 pointer-events-none"
                    aria-hidden
                  />
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.value}
                    onChange={field.onChange}
                    type="text"
                    autoComplete="name"
                    placeholder="Your name"
                    disabled={isPending}
                    required
                    className={cn(
                      "pl-9 h-10 text-sm",
                      "bg-zinc-50 border-zinc-200 dark:bg-white/[0.04] dark:border-white/[0.08]",
                      "text-zinc-900 placeholder:text-zinc-400 dark:text-zinc-100 dark:placeholder:text-zinc-600",
                      "focus-visible:ring-1 focus-visible:ring-violet-500/60 focus-visible:border-violet-500/60",
                      "transition-colors",
                      fieldState.invalid &&
                        "border-red-400 dark:border-red-500/60"
                    )}
                  />
                </div>
                {fieldState.error?.message && (
                  <p id="email-error" className="text-xs text-red-500 mt-1">
                    {fieldState.error?.message}
                  </p>
                )}
              </Field>
            )}
          />

          {/* Email */}
          <Controller
            name="email"
            control={control}
            disabled={isPending}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                <div className="relative">
                  <MailIcon
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-600 pointer-events-none"
                    aria-hidden
                  />
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.value}
                    onChange={field.onChange}
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    disabled={isPending}
                    required
                    className={cn(
                      "pl-9 h-10 text-sm",
                      "bg-zinc-50 border-zinc-200 dark:bg-white/[0.04] dark:border-white/[0.08]",
                      "text-zinc-900 placeholder:text-zinc-400 dark:text-zinc-100 dark:placeholder:text-zinc-600",
                      "focus-visible:ring-1 focus-visible:ring-violet-500/60 focus-visible:border-violet-500/60",
                      "transition-colors",
                      fieldState.invalid &&
                        "border-red-400 dark:border-red-500/60"
                    )}
                  />
                </div>
                {fieldState.error?.message && (
                  <p id="email-error" className="text-xs text-red-500 mt-1">
                    {fieldState.error?.message}
                  </p>
                )}
              </Field>
            )}
          />

          {/* Password */}
          <Controller
            name="password"
            control={control}
            disabled={isPending}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                <div className="relative">
                  <LockIcon
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-600 pointer-events-none"
                    aria-hidden
                  />
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.value}
                    onChange={field.onChange}
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className={cn(
                      "pl-9 pr-10 h-10 text-sm",
                      "bg-zinc-50 border-zinc-200 dark:bg-white/[0.04] dark:border-white/[0.08]",
                      "text-zinc-900 placeholder:text-zinc-400 dark:text-zinc-100 dark:placeholder:text-zinc-600",
                      "focus-visible:ring-1 focus-visible:ring-violet-500/60 focus-visible:border-violet-500/60",
                      "transition-colors",
                      fieldState.invalid &&
                        "border-red-400 dark:border-red-500/60"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:text-zinc-600 dark:hover:text-zinc-400 transition-colors focus-visible:outline-none"
                    aria-label={
                      showPassword ? "パスワードを隠す" : "パスワードを表示"
                    }
                  >
                    {showPassword ? (
                      <EyeOffIcon className="h-4 w-4" />
                    ) : (
                      <EyeIcon className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {fieldState.error?.message && (
                  <p id="email-error" className="text-xs text-red-500 mt-1">
                    {fieldState.error?.message}
                  </p>
                )}
              </Field>
            )}
          />

          {/* フォームレベルエラー */}
          <div id="form-error" aria-live="polite" aria-atomic="true">
            {errors.form?.message && (
              <div className="flex items-start gap-2 rounded-lg border border-red-300/60 bg-red-50 dark:border-red-500/20 dark:bg-red-500/10 px-3 py-2.5 text-sm text-red-600 dark:text-red-400">
                <span className="mt-px shrink-0 text-red-500">✕</span>
                <span>{errors.form.message}</span>
              </div>
            )}
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={isPending}
            className={cn(
              "w-full h-10 mt-1 text-sm font-medium tracking-wide",
              "bg-violet-600 hover:bg-violet-500 active:bg-violet-700",
              "text-white border-0 shadow-none",
              "transition-colors",
              "disabled:opacity-50"
            )}
          >
            {isPending ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                <span>Creating account...</span>
              </>
            ) : (
              "Register & Sign in"
            )}
          </Button>

          {/* サインインへのリンク */}
          <p className="text-center text-sm text-zinc-500">
            すでにアカウントをお持ちの方は{" "}
            <Link
              href="/sign-in"
              className="text-violet-500 hover:text-violet-600 dark:text-violet-400 dark:hover:text-violet-300 transition-colors underline-offset-4 hover:underline"
            >
              サインイン
            </Link>
          </p>
        </form>

        <div className="h-px bg-gradient-to-r from-transparent via-zinc-200 dark:via-white/[0.06] to-transparent" />
      </div>

      <div className="absolute -bottom-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-zinc-300/50 dark:via-white/[0.04] to-transparent" />
    </div>
  );
}
