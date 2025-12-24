import { useCallback, useState } from "react";

export const useMediaViewer = () => {
  const [viewerOpen, setViewerOpen] = useState(false);

  const openViewer = useCallback(() => {
    setViewerOpen(true);
  }, []);

  const closeViewer = useCallback(() => {
    setViewerOpen(false);
  }, []);

  return {
    viewerOpen,
    openViewer,
    closeViewer,
  };
};
