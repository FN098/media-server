import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined
  );

  React.useEffect(() => {
    // User Agentでモバイルデバイスを検出
    const checkIsMobileDevice = () => {
      const ua = navigator.userAgent.toLowerCase();
      const isMobileUA =
        /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
          ua
        );

      // タッチデバイスかどうかもチェック
      const isTouchDevice =
        "ontouchstart" in window || navigator.maxTouchPoints > 0;

      // 画面幅もチェック（ただし、モバイルデバイスなら向きに関わらずtrueとする）
      const isNarrowScreen = window.innerWidth < MOBILE_BREAKPOINT;

      // モバイルデバイスであれば画面幅に関わらずtrue
      // そうでなければ画面幅で判定
      return isMobileUA || (isTouchDevice && isNarrowScreen);
    };

    const updateIsMobile = () => {
      setIsMobile(checkIsMobileDevice());
    };

    // 初期判定
    updateIsMobile();

    // リサイズ時の再判定（orientationchangeも監視）
    window.addEventListener("resize", updateIsMobile);
    window.addEventListener("orientationchange", updateIsMobile);

    return () => {
      window.removeEventListener("resize", updateIsMobile);
      window.removeEventListener("orientationchange", updateIsMobile);
    };
  }, []);

  return !!isMobile;
}
