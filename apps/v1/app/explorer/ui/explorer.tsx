"use client";

import { Breadcrumbs } from "@/app/explorer/ui/breadcrumbs";
import { MediaFsListing, MediaFsNode } from "@/app/lib/media/types";
import { Button } from "@/shadcn/components/ui/button";
import { Card, CardContent } from "@/shadcn/components/ui/card";
import { Input } from "@/shadcn/components/ui/input";
import {
  ArrowLeft,
  File,
  Folder,
  Grid,
  Image as ImageIcon,
  List,
  Music,
  Video,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type ViewMode = "list" | "grid";

function MediaThumb({ node }: { node: MediaFsNode }) {
  if (node.isDirectory) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted">
        <Folder className="h-12 w-12 text-blue-600" />
      </div>
    );
  }

  if (node.type === "image") {
    return (
      <div className="relative h-full w-full">
        {/* TODO: Image だと画像表示されない */}
        <img
          src={`/api/media/${node.path}`}
          alt={node.name}
          width="500"
          height="500"
          className="object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  if (node.type === "video") {
    return (
      <video
        src={`/api/media/${node.path}`}
        poster={`/api/media/.thumbs/${node.path}.jpg`}
        className="h-full w-full object-cover"
        muted
        preload="metadata"
      />
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-muted">
      <File className="h-10 w-10 text-gray-600" />
    </div>
  );
}

function FileIcon(e: MediaFsNode) {
  switch (e.type) {
    case "directory":
      return <Folder className="shrink-0 h-6 w-6 text-blue-600" />;
    case "image":
      return <ImageIcon className="shrink-0 h-6 w-6 text-purple-600" />;
    case "video":
      return <Video className="shrink-0 h-6 w-6 text-green-600" />;
    case "audio":
      return <Music className="shrink-0 h-6 w-6 text-orange-600" />;
    default:
      return <File className="shrink-0 h-6 w-6 text-gray-600" />;
  }
}

function FileRow({
  node,
  onOpen,
}: {
  node: MediaFsNode;
  onOpen: (p: string) => void;
}) {
  return (
    <div
      onClick={() => node.isDirectory && onOpen(node.path)}
      className="grid cursor-pointer grid-cols-4 items-center px-4 py-2 text-sm hover:bg-blue-100"
    >
      <div className="flex items-center gap-2">
        {FileIcon(node)}
        {node.name}
      </div>
      <div>{node.isDirectory ? "Folder" : node.type}</div>
      <div>{node.updatedAt ?? "-"}</div>
      <div>{node.size ? `${Math.round(node.size / 1024)} KB` : "-"}</div>
    </div>
  );
}

function GridItem({
  node,
  onOpen,
}: {
  node: MediaFsNode;
  onOpen: (p: string) => void;
}) {
  return (
    <div
      onClick={() => node.isDirectory && onOpen(node.path)}
      className="cursor-pointer"
    >
      <div className="aspect-square overflow-hidden rounded-lg border bg-muted">
        <MediaThumb node={node} />
      </div>
      <div className="mt-1 truncate text-center text-xs">{node.name}</div>
    </div>
  );
}

function Search({
  value,
  setValue,
}: {
  value: string;
  setValue: (value: string) => void;
}) {
  return (
    <Input
      placeholder="Search"
      className="w-48"
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
}

function ViewModeSwitch({
  value,
  setValue,
}: {
  value: ViewMode;
  setValue: (value: ViewMode) => void;
}) {
  return (
    <div className="flex gap-1">
      <Button
        size="icon"
        variant={value === "list" ? "default" : "ghost"}
        onClick={() => setValue("list")}
      >
        <List />
      </Button>
      <Button
        size="icon"
        variant={value === "grid" ? "default" : "ghost"}
        onClick={() => setValue("grid")}
      >
        <Grid />
      </Button>
    </div>
  );
}

function GoBackButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <Button size="icon" variant="ghost" disabled={disabled} onClick={onClick}>
      <ArrowLeft />
    </Button>
  );
}

function GridView({
  data,
  onOpen,
}: {
  data: MediaFsNode[];
  onOpen: (target: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
      {data.map((node) => (
        <GridItem key={node.path} node={node} onOpen={onOpen} />
      ))}
    </div>
  );
}

function ListView({
  data,
  onOpen,
}: {
  data: MediaFsNode[];
  onOpen: (target: string) => void;
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
          <FileRow key={node.path} node={node} onOpen={onOpen} />
        ))}
      </CardContent>
    </Card>
  );
}

export default function Explorer() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const path = searchParams.get("p") ?? "";

  const [data, setData] = useState<MediaFsListing | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<ViewMode>("list");

  // パスを変更
  function load(target: string) {
    const params = new URLSearchParams();
    if (target) {
      params.set("p", target);
    }
    router.push(`/explorer?${params.toString()}`);
  }

  // パスが変更されたら API コール
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/explorer?p=${encodeURIComponent(path)}`);
        const json: MediaFsListing = await res.json();
        setData(json);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [path]);

  // 検索ロジック
  const filtered = useMemo(() => {
    if (!data) return [];
    return data.entries.filter((e) =>
      e.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [data, search]);

  return (
    <div className="space-y-4 p-4">
      {/* ===== Top Bar ===== */}
      <div className="flex items-center gap-2">
        <GoBackButton
          disabled={data?.parent == null}
          onClick={() => load(data?.parent ?? "")}
        />
        <Breadcrumbs path={path} onClick={load} />
        <div className="flex-1" />
        <Search value={search} setValue={setSearch} />
        <ViewModeSwitch value={view} setValue={setView} />
      </div>

      {/* ===== Content ===== */}
      {loading && (
        <div className="py-10 text-center text-sm text-muted-foreground">
          Loading...
        </div>
      )}

      {!loading && view === "list" && (
        <ListView data={filtered} onOpen={load} />
      )}

      {!loading && view === "grid" && (
        <GridView data={filtered} onOpen={load} />
      )}
    </div>
  );
}
