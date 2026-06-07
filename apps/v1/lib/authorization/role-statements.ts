import { Statement, statements } from "@/lib/authorization/statements";
import { Role } from "@/lib/user/roles";

export const roleStatements = {
  admin: statements,
  user: [],
} as const satisfies Record<Role, readonly Statement[]>;
