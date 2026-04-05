import { USER } from "@/lib/auth/basic-auth";
import { User } from "@/lib/auth/types";

export async function resolveCurrentUser(): Promise<User> {
  // TODO: ここで実際のユーザ認証ロジックを実装する
  return new Promise((resolve) => {
    resolve({
      id: USER,
      name: "Basic User",
    });
  });
}
