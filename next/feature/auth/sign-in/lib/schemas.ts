import z from "zod";

export const SignInFormSchema = z.object({
  email: z
    .email({ message: "有効なメールアドレスを入力してください。" })
    .trim(),

  password: z
    .string()
    .min(1, { message: "パスワードを入力してください。" })
    .trim(),

  rememberMe: z.boolean().optional(),

  redirectTo: z.string().optional().default("/"),
});

export type SignInFormValues = z.infer<typeof SignInFormSchema>;
