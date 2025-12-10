import { MediaThumb } from "@/app/explorer/ui/thumb";
import { MediaFsNode } from "@/app/lib/media/types";
import { Card, CardContent } from "@/shadcn/components/ui/card";
import Link from "next/link";

export function ListView({
  data,
}: {
  data: MediaFsNode[];
  onOpen?: (target: MediaFsNode) => void;
}) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="grid grid-cols-4 bg-muted px-4 py-2 text-sm font-semibold">
          <div>Name</div>
          <div>Type</div>
          <div>Updated</div>
          <div>Size</div>
        </div>

        {data.map((node) => (
          <Link
            key={node.path}
            href={node.isDirectory ? "/explorer/" + node.path : "#"}
            className="cursor-pointer"
          >
            <div className="aspect-square overflow-hidden rounded-lg border bg-muted">
              <MediaThumb node={node} />
            </div>
            <div className="mt-1 truncate text-center text-xs">{node.name}</div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
