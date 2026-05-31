import { MediaSchema } from "@/lib/media/schemas";
import { VirtualPathSchema } from "@/lib/path/schemas";
import { UserSchema } from "@/lib/user/schemas";
import z from "zod";

// schema.prisma の Favorite 定義相当
export const FavoriteSchema = z.object({
  userId: UserSchema.shape.id,
  mediaId: MediaSchema.shape.id,
  rating: z.number().int().nullable(),
  createdAt: z.date(),
});

export const FavoriteCreateOneSchema = z.object({
  userId: UserSchema.shape.id,
  rating: z.number().int().min(1).max(5).nullable(),
  path: VirtualPathSchema,
});

export type FavoriteCreateOneInput = z.input<typeof FavoriteCreateOneSchema>;
