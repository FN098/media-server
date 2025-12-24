import { useEffect } from "react";

export function useBackHandler(onBack: () => void) {
  useEffect(() => {
    const handlePopState = () => {
      window.history.pushState(null, "");
      onBack();
    };

    window.history.pushState(null, "");
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [onBack]);
}
