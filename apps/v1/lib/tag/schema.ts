import z from "zod";

// schema.prisma の Tag 定義相当
export const TagSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  kana: z.string().nullable(),
  isActive: z.boolean(),
  isNew: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
