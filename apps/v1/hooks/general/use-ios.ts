import { useMounted } from "@/hooks/general/use-mounted";

function detectIsIOS(): boolean {
  if (typeof window === "undefined") return false;

  const ua = window.navigator.userAgent;
  const platform = window.navigator.platform;

  // iPhone / iPad / iPod
  const classicIOS = /iPhone|iPad|iPod/.test(ua);

  // iPadOS 13+ (MacIntel + touch)
  const iPadOS = platform === "MacIntel" && window.navigator.maxTouchPoints > 1;

  return classicIOS || iPadOS;
}

export function useIsIOS(): boolean {
  const mounted = useMounted();
  return mounted && detectIsIOS();
}
