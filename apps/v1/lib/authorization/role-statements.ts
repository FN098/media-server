import { Statement } from "@/lib/authorization/statements";
import { Role } from "@/lib/user/roles";

export const roleStatements = {
  admin: ["archive.extract"],
  user: [],
} as const satisfies Record<Role, readonly Statement[]>;
