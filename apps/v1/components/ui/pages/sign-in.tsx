"use client";

import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { PageBackground } from "@/components/ui/backgrounds/page-background";
import { authClient } from "@/lib/auth/better-auth-client";
import { Button } from "@/shadcn/components/ui/button";
import { Checkbox } from "@/shadcn/components/ui/checkbox";
import { Input } from "@/shadcn/components/ui/input";
import { Label } from "@/shadcn/components/ui/label";
import { Spinner } from "@/shadcn/components/ui/spinner";
import { cn } from "@/shadcn/lib/utils";

export function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      setError("");

      const { error } = await authClient.signIn.email({
        email,
        password,
        rememberMe,
      });

      if (error) {
        setError(error.message || "サインインに失敗しました");
        setIsLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch (e) {
      console.log("sign-in-error:", e);
      setError("予期しないエラーが発生しました");
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950">
      {/* 背景装飾 */}
      <PageBackground accent="indigo" />

      {/* カード */}
      <div className="relative w-full max-w-sm mx-4">
        {/* 上部のアクセントライン */}
        <div className="absolute -top-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />

        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl shadow-2xl shadow-black/50">
          <div className="px-8 pt-8 pb-2">
            {/* ロゴ/タイトル */}
            <div className="mb-8">
              <div className="flex items-center gap-2.5 mb-1">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/20 border border-indigo-500/30">
                  <div className="h-2.5 w-2.5 rounded-sm bg-indigo-400" />
                </div>
                <span className="text-xs font-medium tracking-widest text-zinc-500 uppercase">
                  Media Server
                </span>
              </div>
              <h1 className="mt-4 text-xl font-semibold tracking-tight text-white">
                Sign in
              </h1>
              <p className="mt-1 text-sm text-zinc-500">
                アカウントにサインインしてください
              </p>
            </div>
          </div>

          <form
            className="px-8 pb-8 space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              void handleSignIn();
            }}
          >
            {/* Email */}
            <div className="space-y-1.5">
              <Label
                htmlFor="email"
                className="text-xs font-medium text-zinc-400 tracking-wide uppercase"
              >
                Email
              </Label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 pointer-events-none"
                  aria-hidden
                />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                  className={cn(
                    "pl-9 h-10 text-sm",
                    "bg-white/[0.04] border-white/[0.08]",
                    "text-zinc-100 placeholder:text-zinc-600",
                    "focus-visible:ring-1 focus-visible:ring-indigo-500/60 focus-visible:border-indigo-500/60",
                    "transition-colors"
                  )}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label
                htmlFor="password"
                className="text-xs font-medium text-zinc-400 tracking-wide uppercase"
              >
                Password
              </Label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 pointer-events-none"
                  aria-hidden
                />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  className={cn(
                    "pl-9 pr-10 h-10 text-sm",
                    "bg-white/[0.04] border-white/[0.08]",
                    "text-zinc-100 placeholder:text-zinc-600",
                    "focus-visible:ring-1 focus-visible:ring-indigo-500/60 focus-visible:border-indigo-500/60",
                    "transition-colors"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors focus-visible:outline-none focus-visible:text-zinc-400"
                  aria-label={
                    showPassword ? "パスワードを隠す" : "パスワードを表示"
                  }
                  tabIndex={0}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2.5">
              <Checkbox
                id="remember-me"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
                disabled={isLoading}
                className={cn(
                  "h-4 w-4 rounded border-white/[0.15] bg-white/[0.04]",
                  "data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500"
                )}
              />
              <Label
                htmlFor="remember-me"
                className="text-sm text-zinc-400 cursor-pointer select-none"
              >
                ログイン状態を保持する
              </Label>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-sm text-red-400">
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
                "bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700",
                "text-white border-0 shadow-none",
                "transition-colors",
                "disabled:opacity-50"
              )}
            >
              {isLoading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  <span>Signing in...</span>
                </>
              ) : (
                "Sign in"
              )}
            </Button>

            {/* Sign up リンク */}
            <p className="text-center text-sm text-zinc-500">
              アカウントをお持ちでない方は{" "}
              <Link
                href="/sign-up"
                className="text-indigo-400 hover:text-indigo-300 transition-colors underline-offset-4 hover:underline"
              >
                新規登録
              </Link>
            </p>
          </form>

          {/* 下部の区切り線 */}
          <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        </div>

        {/* 下部装飾 */}
        <div className="absolute -bottom-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
      </div>
    </div>
  );
}
