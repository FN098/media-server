import { useCallback, useState } from "react";

export const useScrollLockControl = () => {
  const [isLocked, setIsLocked] = useState(false);
  const [prevOverflowStyle, setPrevOverflowStyle] = useState("");

  const lock = useCallback(() => {
    if (typeof window === "undefined") return;
    if (document.body.style.overflow === "hidden") return;

    const overflow = window.getComputedStyle(document.body).overflow;
    setPrevOverflowStyle(overflow);

    document.body.style.overflow = "hidden";

    setIsLocked(true);
  }, []);

  const unlock = useCallback(() => {
    if (typeof window === "undefined") return;

    // 保存していたスタイルに戻す
    document.body.style.overflow = prevOverflowStyle || "unset";

    setIsLocked(false);
  }, [prevOverflowStyle]);

  return { isLocked, lock, unlock };
};
