"use client";

import { useExplorerContext } from "@/feature/pages/explorer/providers/explorer-provider";

export function Explorer() {
  const { viewer } = useExplorerContext();

  return (
    <div className="flex flex-col focus:outline-none">
      {/* {!viewer.isOpen && <ExplorerToolbar />} */}
      {/* <ExplorerContent /> */}
      {/* <ExplorerOverlays /> */}
      {/* {!viewer.isOpen && <ExplorerFolderNavigation />} */}
    </div>
  );
}
