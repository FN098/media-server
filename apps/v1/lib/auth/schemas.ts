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
  redirectTo: z.string().optional(),
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

export const SignUpFormSchema = z.object({
  name: z
    .string()
    .min(2, { message: "名前は2文字以上で入力してください。" })
    .trim(),
  email: z
    .string()
    .email({ message: "有効なメールアドレスを入力してください。" })
    .trim(),
  password: z
    .string()
    .min(8, { message: "8文字以上で入力してください。" })
    .regex(/[a-zA-Z]/, { message: "英字を1文字以上含めてください。" })
    .regex(/[0-9]/, { message: "数字を1文字以上含めてください。" }),
  redirectTo: z.string().optional(),
});

export type SignUpFormState =
  | {
      errors?: {
        name?: string[];
        email?: string[];
        password?: string[];
      };
      message?: string;
    }
  | undefined;
