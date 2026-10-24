"use client";

import { useExplorerContext } from "@/app/(pages)/explorer/_providers/explorer-provider";

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
