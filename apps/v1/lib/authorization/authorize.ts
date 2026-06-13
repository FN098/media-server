import { AuthUser } from "@/lib/auth/auth-user";
import { resolveCurrentUser } from "@/lib/auth/current-user";
import { hasPermissions } from "@/lib/authorization/permission";
import { Statement } from "@/lib/authorization/statements";

type AuthorizeResult =
  | {
      success: true;
      user: AuthUser;
    }
  | {
      success: false;
      message: string;
      code: "unauthorized" | "forbidden";
    };

export async function authorize(
  ...statements: Statement[]
): Promise<AuthorizeResult> {
  const user = await resolveCurrentUser();

  if (!user) {
    return {
      success: false,
      message: "認証されていません。",
      code: "unauthorized",
    };
  }

  if (!hasPermissions(user, statements)) {
    return { success: false, message: "権限がありません。", code: "forbidden" };
  }

  return { success: true, user };
}
