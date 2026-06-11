import { roles } from "@/lib/user/roles";
import z from "zod";

export const AuthUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.enum(roles),
});

export type AuthUser = z.infer<typeof AuthUserSchema>;

export const SignInFormSchema = z.object({
  email: z
    .email({ message: "有効なメールアドレスを入力してください。" })
    .trim(),
  password: z
    .string()
    .min(1, { message: "パスワードを入力してください。" })
    .trim(),
  rememberMe: z.boolean().optional(),
  redirectTo: z.url().optional(),
});

export type SignInFormState =
  | {
      errors?: {
        email?: string[];
        password?: string[];
      };
      message?: string;
    }
  | undefined;
