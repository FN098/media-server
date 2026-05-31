import { UserSchema } from "@/lib/user/schemas";
import z from "zod";

// schema.prisma の VisitedFolder 定義相当
export const VisitedFolderSchema = z.object({
  userId: UserSchema.shape.id,
  dirPath: z.string(),
  isPinned: z.boolean(),
  lastViewedAt: z.date(),
});

// schema.prisma の FolderMeta 定義相当
export const FolderMetaSchema = z.object({
  path: z.string(),
  previewPath: z.string().nullable(),
  title: z.string().nullable(),
  totalSize: z.bigint(),
  fileCount: z.number().int(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
