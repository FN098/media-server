import { roles } from "@/lib/user/roles";
import z from "zod";

export const AuthUserSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  role: z.enum(roles),
});
