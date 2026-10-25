import z from "zod";

/** @deprecated */
export const NextPublicEnvSchema = z.object({
  NEXT_PUBLIC_WEB_UI_URL: z.url().nullable().optional(),
  NEXT_PUBLIC_API_URL: z.url().nullable().optional(),
});

/** @deprecated */
export type NextPublicEnv = z.infer<typeof NextPublicEnvSchema>;

/** @deprecated */
export const ServerOnlyEnvSchema = z.object({
  DATABASE_URL: z.string().nonempty(),
});

/** @deprecated */
export type ServerOnlyEnv = z.infer<typeof ServerOnlyEnvSchema>;
