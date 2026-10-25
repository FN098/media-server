import { hasPermissions } from "@/__lib/authorization/permission";
import { Statement } from "@/__lib/authorization/statements";
import { getCurrentUser } from "@/lib/auth/current-user";
import { CurrentUser } from "@/lib/auth/current-user-schema";

type AuthorizeResult =
  | {
      success: true;
      user: CurrentUser;
    }
  | {
      success: false;
      message: string;
      reason: "unauthorized" | "forbidden";
    };

export async function authorize(
  ...statements: Statement[]
): Promise<AuthorizeResult> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      success: false,
      message: "認証されていません。",
      reason: "unauthorized",
    };
  }

  if (!hasPermissions(user, statements)) {
    return {
      success: false,
      message: "権限がありません。",
      reason: "forbidden",
    };
  }

  return { success: true, user };
}
