"use client";

import type { RecentFolder } from "@/generated/prisma/client";
import { getClientExplorerPath } from "@/lib/path-helpers";
import { Button } from "@/shadcn/components/ui/button";
import Link from "next/link";

type RecentFoldersProps = {
  folders: RecentFolder[];
};

export function RecentFolders({ folders }: RecentFoldersProps) {
  if (folders.length === 0)
    return (
      <div className="text-sm text-gray-500">
        最近開いたフォルダはありません
      </div>
    );

  return (
    <div className="flex flex-col gap-2 w-full max-w-md">
      {folders.map((folder) => (
        <Button key={folder.dirPath} variant="outline" asChild>
          <Link href={getClientExplorerPath(folder.dirPath)}>
            {folder.dirPath}
          </Link>
        </Button>
      ))}
    </div>
  );
}
