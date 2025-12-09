"use client";

import { MediaFsListing, MediaFsNode } from "@/app/types/media-fs";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function Explorer() {
  const [listing, setListing] = useState<MediaFsListing | null>(null);

  const load = async (dir: string) => {
    const res = await fetch(`/api/explorer?dir=${encodeURIComponent(dir)}`);
    const json = (await res.json()) as MediaFsListing;
    setListing(json);
  };

  useEffect(() => {
    (async () => {
      await load(""); // 最初に /media を開く
    })();
  }, []);

  if (!listing) return <div>Loading...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2>Explorer / {listing.path}</h2>

      {listing.parent !== null && (
        <button
          onClick={() => load(listing.parent!)}
          style={{ marginBottom: 10 }}
        >
          ⬅ 上のフォルダへ
        </button>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, 160px)",
          gap: 20,
        }}
      >
        {listing.entries.map((entry) => (
          <ExplorerCard key={entry.path} entry={entry} onOpen={load} />
        ))}
      </div>
    </div>
  );
}

function ExplorerCard({
  entry,
  onOpen,
}: {
  entry: MediaFsNode;
  onOpen: (path: string) => void;
}) {
  const isImage = entry.type === "image";
  const isDir = entry.isDirectory;

  return (
    <div
      style={{ textAlign: "center", cursor: "pointer" }}
      onClick={() => isDir && onOpen(entry.path)}
    >
      {isImage ? (
        <Image
          src={`/api/media/${entry.path}`}
          alt=""
          width={150}
          height={150}
          style={{ objectFit: "cover" }}
        />
      ) : (
        <div
          style={{
            width: 150,
            height: 150,
            background: "#eee",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontSize: 40,
          }}
        >
          {isDir ? "📁" : entry.type === "video" ? "🎥" : "📄"}
        </div>
      )}

      <div style={{ marginTop: 5 }}>{entry.name}</div>
    </div>
  );
}
