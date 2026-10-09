import { CurrentUser } from "@/lib/auth/current-user-schema";
import { roleStatements } from "@/lib/authorization/role-statements";
import { Statement } from "@/lib/authorization/statements";
import { Role } from "@/lib/user/roles";

// O(1) 検索用
const roleStatementSet: Record<Role, ReadonlySet<Statement>> = {
  admin: new Set(roleStatements.admin),
  user: new Set(roleStatements.user),
};

export function hasPermission(
  user: CurrentUser,
  statement: Statement
): boolean {
  const statements = roleStatementSet[user.role];
  return statements.has(statement);
}

export function hasPermissions(
  user: CurrentUser,
  statements: Statement[]
): boolean {
  return statements.every((stmt) => hasPermission(user, stmt));
}
