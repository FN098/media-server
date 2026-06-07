import { AuthUserSchema } from "@/lib/auth/schemas";
import z from "zod";

export type AuthUser = z.infer<typeof AuthUserSchema>;
