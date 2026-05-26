"use client";

import { useEffect, useReducer } from "react";

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

  // 全画面にする
  const enterFullscreen = async (element = document.documentElement) => {
    if (!isSupported || document.fullscreenElement) return;
    await element.requestFullscreen();
  };

  // 全画面を解除する
  const exitFullscreen = async () => {
    if (!isSupported || !document.fullscreenElement) return;
    await document.exitFullscreen();
  };

  // 切り替え
  const toggleFullscreen = async () => {
    if (document.fullscreenElement) {
      await exitFullscreen();
    } else {
      await enterFullscreen();
    }
  };

  return {
    isSupported,
    isFullscreen,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
  };
}
