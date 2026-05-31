import z from "zod";

const toArray = (v?: string | null) =>
  v
    ? v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

export const NextPublicEnvSchema = z.object({
  NEXT_PUBLIC_WEB_UI_URL: z.url().nullable().optional(),
  NEXT_PUBLIC_WEB_API_URL: z.url().nullable().optional(),
});

export type NextPublicEnv = z.infer<typeof NextPublicEnvSchema>;

export const ServerOnlyEnvSchema = z.object({
  DATABASE_URL: z.string().nonempty("DATABASE_URL required"),

  BLOCKED_EXPLORER_PATHS: z
    .string()
    .transform((data) => toArray(data))
    .optional(),

  PROTECTED_EXPLORER_PATHS: z
    .string()
    .transform((data) => toArray(data))
    .optional(),
});

export type ServerOnlyEnv = z.infer<typeof ServerOnlyEnvSchema>;
