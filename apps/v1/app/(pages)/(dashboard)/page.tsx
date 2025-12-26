import { USER } from "@/basic-auth";
import { RecentFolders } from "@/components/ui/recent-folders";
import { getRecentFolders } from "@/lib/folder/repository";
import { Button } from "@/shadcn/components/ui/button";
import Link from "next/link";

export default async function Page() {
  // TODO: ユーザー認証機能実装後に差し替える
  const folders = await getRecentFolders(USER);

  return (
    <div className="flex flex-col items-center gap-4">
      <Button asChild>
        <Link href="/explorer">Start Exploring</Link>
      </Button>

      <RecentFolders folders={folders} />
    </div>
  );
}
