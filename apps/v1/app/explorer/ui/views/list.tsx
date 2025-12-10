import { ThumbIcon } from "@/app/explorer/ui/deprecated";
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
        <div className="grid grid-cols-4 px-4 py-2 bg-muted font-semibold text-sm">
          <div>Name</div>
          <div>Type</div>
          <div>Updated</div>
          <div>Size</div>
        </div>
        {data.map((node) => (
          <Link
            key={node.path}
            href={node.isDirectory ? "/explorer/" + node.path : "#"}
            className="grid grid-cols-4 px-4 py-2 items-center hover:bg-blue-100"
          >
            <div className="flex gap-2">
              <ThumbIcon node={node} />
              <span className="truncate">{node.name}</span>
            </div>
            <div>{node.isDirectory ? "Folder" : node.type}</div>
            <div>{node.updatedAt ?? "-"}</div>
            <div>{node.size ? `${Math.round(node.size / 1024)} KB` : "-"}</div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
