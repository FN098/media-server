import z from "zod";

export const explorerQuerySchema = z.object({
  q: z.string().optional(),

  modal: z
    .literal("true")
    .transform(() => true)
    .optional()
    .default(false),

  view: z.enum(["grid", "list"]).optional().default("grid"),

  at: z
    .union([z.coerce.number().int().nonnegative(), z.enum(["first", "last"])])
    .optional()
    .nullable()
    .default(null),
});
