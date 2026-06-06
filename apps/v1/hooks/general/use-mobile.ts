import * as React from "react";

const MOBILE_BREAKPOINT = 768;

function detectMobile() {
  const ua = navigator.userAgent.toLowerCase();

  const isMobileUA =
    /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);

  const isTouchDevice =
    "ontouchstart" in window || navigator.maxTouchPoints > 0;

  const isNarrowScreen = window.innerWidth < MOBILE_BREAKPOINT;

  return isMobileUA || (isTouchDevice && isNarrowScreen);
}

export function useDetectMobile() {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(
      `(max-width: ${MOBILE_BREAKPOINT - 1}px)`
    );

    const update = () => {
      setIsMobile(detectMobile());
    };

    update();

    mediaQuery.addEventListener("change", update);
    window.addEventListener("orientationchange", update);

    return () => {
      mediaQuery.removeEventListener("change", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  return isMobile;
}
