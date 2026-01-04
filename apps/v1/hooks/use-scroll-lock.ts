"use client";

import { useCallback } from "react";

let lockCount = 0;
let prevOverflow = "";

export const useScrollLockControl = () => {
  const lock = useCallback(() => {
    if (typeof window === "undefined") return;
    if (lockCount === 0) {
      prevOverflow = document.body.style.overflow || "";
      document.body.style.overflow = "hidden";
    }
    lockCount += 1;
  }, []);

  const unlock = useCallback(() => {
    if (typeof window === "undefined") return;
    if (lockCount <= 0) return;
    lockCount -= 1;
    if (lockCount === 0) {
      document.body.style.overflow = prevOverflow || "unset";
    }
  }, []);

  return { lock, unlock };
};
