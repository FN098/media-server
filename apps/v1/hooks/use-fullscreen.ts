"use client";

import { useCallback, useEffect, useReducer } from "react";

export function useFullscreen() {
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  useEffect(() => {
    const handler = () => forceUpdate();
    document.addEventListener("fullscreenchange", handler);
    return () => {
      document.removeEventListener("fullscreenchange", handler);
    };
  }, []);

  const isSupported =
    typeof document !== "undefined" &&
    typeof document.documentElement.requestFullscreen === "function";

  const isFullscreen =
    typeof document !== "undefined" && !!document.fullscreenElement;

  const enter = useCallback(
    async (element = document.documentElement) => {
      if (!isSupported || document.fullscreenElement) return;
      await element.requestFullscreen();
    },
    [isSupported]
  );

  const exit = useCallback(async () => {
    if (!isSupported || !document.fullscreenElement) return;
    await document.exitFullscreen();
  }, [isSupported]);

  const toggle = useCallback(async () => {
    if (document.fullscreenElement) {
      await exit();
    } else {
      await enter();
    }
  }, [enter, exit]);

  return {
    isSupported,
    isFullscreen,
    enter,
    exit,
    toggle,
  };
}
