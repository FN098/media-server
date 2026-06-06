"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { authClient } from "@/lib/auth/better-auth-client";
import { Alert, AlertDescription } from "@/shadcn/components/ui/alert";
import { Button } from "@/shadcn/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shadcn/components/ui/card";
import { Input } from "@/shadcn/components/ui/input";
import { Label } from "@/shadcn/components/ui/label";
import { Spinner } from "@/shadcn/components/ui/spinner";

// TODO: remember me 追加
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      setError("");

      const { error } = await authClient.signIn.email({
        email,
        password,
      });

      if (error) {
        setError(error.message || "ログインに失敗しました");
        return;
      }

      router.push("/");
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Media Server Login</CardTitle>
        </CardHeader>

        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void handleLogin();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>

              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>

              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Spinner />}
              Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
