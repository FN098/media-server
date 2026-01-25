import { getClientExplorerPath } from "@/lib/path/helpers";
import { Button } from "@/shadcn/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export function FolderNavigation({
  prevHref,
  nextHref,
}: {
  prevHref?: string | null;
  nextHref?: string | null;
}) {
  const searchParams = useSearchParams();
  const withParams = (path: string) =>
    searchParams.toString() ? `${path}?${searchParams.toString()}` : path;

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
            <Link href={withParams(encodeURI(getClientExplorerPath(prevHref)))}>
              <div className="flex items-center text-xs text-muted-foreground group-hover:text-primary">
                <ArrowLeft className="mr-1 h-3 w-3" />
                Previous
              </div>
              <div className="text-base font-medium truncate w-full text-left">
                {prevHref.split("/").filter(Boolean).pop()}
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
            <Link href={withParams(encodeURI(getClientExplorerPath(nextHref)))}>
              <div className="flex items-center text-xs text-muted-foreground group-hover:text-primary">
                Next
                <ArrowRight className="ml-1 h-3 w-3" />
              </div>
              <div className="text-base font-medium truncate w-full text-right">
                {nextHref.split("/").filter(Boolean).pop()}
              </div>
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
