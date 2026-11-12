import { useEffect, useState } from "react";

export interface Modifiers {
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
}

export function useModifiers() {
  const [modifiers, setModifiers] = useState<Modifiers>({
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
  });

  useEffect(() => {
    const handleKeyEvent = (e: KeyboardEvent) => {
      setModifiers({
        ctrlKey: e.ctrlKey,
        metaKey: e.metaKey,
        shiftKey: e.shiftKey,
      });
    };

    const handleBlur = () => {
      setModifiers({ ctrlKey: false, metaKey: false, shiftKey: false });
    };

    window.addEventListener("keydown", handleKeyEvent);
    window.addEventListener("keyup", handleKeyEvent);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("keydown", handleKeyEvent);
      window.removeEventListener("keyup", handleKeyEvent);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  return modifiers;
}
