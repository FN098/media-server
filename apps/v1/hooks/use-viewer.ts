"use client";

import { useState } from "react";

export function useViewer() {
  const [isHeaderPinned, setIsHeaderPinned] = useState(false);

  const toggleIsHeaderPinned = () => setIsHeaderPinned((prev) => !prev);

  return {
    isHeaderPinned,
    setIsHeaderPinned,
    toggleIsHeaderPinned,
  };
}
