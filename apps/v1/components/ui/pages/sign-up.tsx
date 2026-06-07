"use client";

import { authClient } from "@/lib/auth/better-auth-client";
import { Eye, EyeOff, Lock, Mail, ShieldAlert, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { Button } from "@/shadcn/components/ui/button";
import { Input } from "@/shadcn/components/ui/input";
import { Label } from "@/shadcn/components/ui/label";
import { Spinner } from "@/shadcn/components/ui/spinner";
import { cn } from "@/shadcn/lib/utils";
import Link from "next/link";

interface SignUpProps {
  hasAdmin: boolean;
}

export function SignUp({ hasAdmin }: SignUpProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const handleSignup = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const { error } = await authClient.signUp.email(
        {
          email,
          password,
          name,
        },
        {
          onSuccess: () => {
            router.push("/");
          },
        }
      );

      if (error) {
        setError(error.message || "サインアップに失敗しました");
        setIsLoading(false);
        return;
      }
    } catch (e) {
      console.log("sign-in-error:", e);
      setError("予期しないエラーが発生しました");
      setIsLoading(false);
    }
  }, [email, name, password, router]);

  return (
    <div className="relative w-full max-w-sm mx-4">
      <div className="absolute -top-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-violet-500/60 dark:via-violet-500 to-transparent" />

      <div className="rounded-2xl border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.03] backdrop-blur-xl shadow-xl shadow-zinc-200/50 dark:shadow-2xl dark:shadow-black/50">
        <div className="px-8 pt-8 pb-2">
          {/* タイトル */}
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
              <ShieldAlert
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

        <form
          className="px-8 pb-8 space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            void handleSignup();
          }}
        >
          {/* Name */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 tracking-wide uppercase">
              Name
            </Label>
            <div className="relative">
              <User
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-600 pointer-events-none"
                aria-hidden
              />
              <Input
                type="text"
                autoComplete="name"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                required
                className={cn(
                  "pl-9 h-10 text-sm",
                  "bg-zinc-50 border-zinc-200 dark:bg-white/[0.04] dark:border-white/[0.08]",
                  "text-zinc-900 placeholder:text-zinc-400 dark:text-zinc-100 dark:placeholder:text-zinc-600",
                  "focus-visible:ring-1 focus-visible:ring-violet-500/60 focus-visible:border-violet-500/60",
                  "transition-colors"
                )}
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 tracking-wide uppercase">
              Email
            </Label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-600 pointer-events-none"
                aria-hidden
              />
              <Input
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
                className={cn(
                  "pl-9 h-10 text-sm",
                  "bg-zinc-50 border-zinc-200 dark:bg-white/[0.04] dark:border-white/[0.08]",
                  "text-zinc-900 placeholder:text-zinc-400 dark:text-zinc-100 dark:placeholder:text-zinc-600",
                  "focus-visible:ring-1 focus-visible:ring-violet-500/60 focus-visible:border-violet-500/60",
                  "transition-colors"
                )}
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 tracking-wide uppercase">
              Password
            </Label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-600 pointer-events-none"
                aria-hidden
              />
              <Input
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
                className={cn(
                  "pl-9 pr-10 h-10 text-sm",
                  "bg-zinc-50 border-zinc-200 dark:bg-white/[0.04] dark:border-white/[0.08]",
                  "text-zinc-900 placeholder:text-zinc-400 dark:text-zinc-100 dark:placeholder:text-zinc-600",
                  "focus-visible:ring-1 focus-visible:ring-violet-500/60 focus-visible:border-violet-500/60",
                  "transition-colors"
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
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-300/60 bg-red-50 dark:border-red-500/20 dark:bg-red-500/10 px-3 py-2.5 text-sm text-red-600 dark:text-red-400">
              <span className="mt-px shrink-0 text-red-500">✕</span>
              <span>{error}</span>
            </div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            disabled={isLoading}
            className={cn(
              "w-full h-10 mt-1 text-sm font-medium tracking-wide",
              "bg-violet-600 hover:bg-violet-500 active:bg-violet-700",
              "text-white border-0 shadow-none",
              "transition-colors",
              "disabled:opacity-50"
            )}
          >
            {isLoading ? (
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
