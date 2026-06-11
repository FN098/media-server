import { Statement, statements } from "@/lib/authorization/statements";
import { Role } from "@/lib/user/roles";

export const roleStatements = {
  admin: [
    // 管理者ユーザーは定義済みの全ステートメントを許可
    ...statements,
  ],
  user: [
    // 一般ユーザーに許可する権限を個別に許可
    // 現状はすべての操作を禁止
  ],
} as const satisfies Record<Role, readonly Statement[]>;
