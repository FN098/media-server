import { useState } from "react";

export function useAudioRepeating() {
  const [enabled, setEnabled] = useState(false);

  return { enabled, setEnabled };
}
