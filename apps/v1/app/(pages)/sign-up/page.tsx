"use client";

import { authClient } from "@/lib/auth/better-auth-client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSignup = async () => {
    setError("");

    // サインアップ処理の実行
    const { error } = await authClient.signUp.email({
      email,
      password,
      name,
    });

    if (error) {
      setError(error.message || "サインアップに失敗しました");
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "100px auto", padding: "20px" }}>
      <h2>Create Admin Account</h2>
      <p style={{ fontSize: "0.85rem", color: "gray" }}>
        システムに管理者が存在しません。最初のユーザーは自動的に管理者 (Admin)
        となります。
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSignup();
        }}
      >
        <div>
          <label>Name: </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div style={{ marginTop: "10px" }}>
          <label>Email: </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div style={{ marginTop: "10px" }}>
          <label>Password: </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit" style={{ marginTop: "15px" }}>
          Register & Login
        </button>
      </form>
    </div>
  );
}
