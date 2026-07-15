import { roles } from "@/lib/user/roles";
import z from "zod";

export const AuthUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.enum(roles),
});

export type AuthUser = z.infer<typeof AuthUserSchema>;
