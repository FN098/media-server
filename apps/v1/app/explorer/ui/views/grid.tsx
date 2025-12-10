import { MediaThumb } from "@/app/explorer/ui/thumb";
import { MediaFsNode } from "@/app/lib/media/types";
import Link from "next/link";

export function GridView({
  data,
}: {
  data: MediaFsNode[];
  onOpen?: (target: MediaFsNode) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
      {data.map((node) => (
        <div key={node.path}>
          <Link
            href={node.isDirectory ? "/explorer/" + node.path : "#"}
            className="cursor-pointer"
          >
            <div className="aspect-square overflow-hidden rounded-lg border bg-muted">
              <MediaThumb node={node} />
            </div>
          </Link>
          <div className="mt-1 truncate text-center text-xs">{node.name}</div>
        </div>
      ))}
    </div>
  );
}
