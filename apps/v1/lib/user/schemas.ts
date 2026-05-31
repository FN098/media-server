import z from "zod";

// schema.prisma の User 定義相当
export const UserSchema = z.object({
  id: z.uuidv7(),
  email: z.email(),
  password: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
