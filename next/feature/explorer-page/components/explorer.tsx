"use client";

import { ExplorerContent } from "@/feature/explorer-page/components/explorer-content";
import { ExplorerFolderNavigation } from "@/feature/explorer-page/components/explorer-navigation";
import { useViewerContext } from "@/feature/viewer/providers/viewer-provider";

export function Explorer() {
  const viewer = useViewerContext();

  return (
    <div className="flex flex-col focus:outline-none">
      {/* {!viewer.isOpen && <ExplorerToolbar />} */}
      <ExplorerContent />
      {/* <ExplorerOverlays /> */}
      {!viewer.isOpen && <ExplorerFolderNavigation />}
    </div>
  );
}
