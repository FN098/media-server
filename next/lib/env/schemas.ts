import z from "zod";

export const NextPublicEnvSchema = z.object({
  NEXT_PUBLIC_WEB_UI_URL: z.url().nullable().optional(),
  NEXT_PUBLIC_API_URL: z.url().nullable().optional(),
});

export type NextPublicEnv = z.infer<typeof NextPublicEnvSchema>;

export const ServerOnlyEnvSchema = z.object({
  DATABASE_URL: z.string().nonempty(),
});

export type ServerOnlyEnv = z.infer<typeof ServerOnlyEnvSchema>;
