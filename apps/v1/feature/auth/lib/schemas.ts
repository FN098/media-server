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

export const SignUpFormSchema = z.object({
  name: z
    .string()
    .min(2, { message: "名前は2文字以上で入力してください。" })
    .trim(),

  email: z
    .email({ message: "有効なメールアドレスを入力してください。" })
    .trim(),

  password: z
    .string()
    .min(8, { message: "8文字以上で入力してください。" })
    .regex(/[a-zA-Z]/, { message: "英字を1文字以上含めてください。" })
    .regex(/[0-9]/, { message: "数字を1文字以上含めてください。" }),

  rememberMe: z.boolean().optional(),

  redirectTo: z.string().optional().default("/"),
});

export type SignUpFormValues = z.infer<typeof SignUpFormSchema>;
