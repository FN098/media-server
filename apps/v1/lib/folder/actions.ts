"use server";

import { USER } from "@/basic-auth";
import { visitFolder } from "@/lib/folder/visit";
import { PATHS } from "@/lib/path";
import { revalidatePath } from "next/cache";

export async function visitFolderAction(dirPath: string): Promise<void> {
  // TODO: ユーザー認証機能実装後に差し替える
  await visitFolder(dirPath, USER);

  // ダッシュボードの履歴キャッシュをクリア
  revalidatePath(PATHS.client.dashboard.root);
}
