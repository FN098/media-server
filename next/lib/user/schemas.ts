import { roles } from "@/lib/user/roles";
import z from "zod";

export const UserSchema = z.object({
  id: z.string(),
  email: z.email(),
  role: z.enum(roles),
  createdAt: z.date(),
  updatedAt: z.date(),
});
