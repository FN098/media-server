import { roles } from "@/lib/user/roles";
import z from "zod";

export const currentUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.enum(roles),
});

export type CurrentUser = z.infer<typeof currentUserSchema>;
