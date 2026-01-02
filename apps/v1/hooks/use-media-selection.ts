import { useMemo, useState } from "react";

export function useMediaViewer() {
  const [currentMediaIndex, setCurrentMediaIndex] = useState<number | null>(
    null
  );

  return useMemo(
    () => ({
      currentMediaIndex,
      setCurrentMediaIndex,
    }),
    [currentMediaIndex]
  );
}
