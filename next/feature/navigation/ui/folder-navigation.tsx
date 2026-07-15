import { resolveClientPath } from "@/lib/path/resolvers";
import { Button } from "@/shadcn/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { basename } from "path";

interface FolderNavigationProps {
  prevPath?: string | null;
  nextPath?: string | null;
  mode?: "explorer" | "trash";
}

export function FolderNavigation({
  prevPath,
  nextPath,
  mode = "explorer",
}: FolderNavigationProps) {
  const isDeleted = mode === "trash";

  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams);

  // 不要なパラメータを削除
  params.delete("page");
  params.delete("q");

  const withParams = (path: string) =>
    params.toString() ? `${path}?${params.toString()}` : path;

  // 前のフォルダ
  const prevHref = prevPath
    ? withParams(resolveClientPath(prevPath, { isDeleted }))
    : null;

  const prevTitle = basename(prevPath ?? "");

  // 次のフォルダ
  const nextHref = nextPath
    ? withParams(resolveClientPath(nextPath, { isDeleted }))
    : null;

  const nextTitle = basename(nextPath ?? "");

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4">
      {/* 前のフォルダ */}
      <div className="w-full sm:flex-1">
        {prevHref && (
          <Button
            variant="outline"
            className="group flex flex-col items-start gap-1 h-auto py-4 px-6 w-full sm:max-w-[280px] hover:bg-accent transition-all"
            asChild
          >
            <Link href={prevHref}>
              <div className="flex items-center text-xs text-muted-foreground group-hover:text-primary">
                <ArrowLeft className="mr-1 h-3 w-3" />
                Previous
              </div>
              <div
                className="text-base font-medium truncate w-full text-left"
                title={prevTitle}
              >
                {prevTitle}
              </div>
            </Link>
          </Button>
        )}
      </div>

      {/* 次のフォルダ */}
      <div className="w-full sm:flex-1 flex justify-end">
        {nextHref && (
          <Button
            variant="outline"
            className="group flex flex-col items-end gap-1 h-auto py-4 px-6 w-full sm:max-w-[280px] hover:bg-accent transition-all"
            asChild
          >
            <Link href={nextHref}>
              <div className="flex items-center text-xs text-muted-foreground group-hover:text-primary">
                Next
                <ArrowRight className="ml-1 h-3 w-3" />
              </div>
              <div
                className="text-base font-medium truncate w-full text-right"
                title={nextTitle}
              >
                {nextTitle}
              </div>
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
