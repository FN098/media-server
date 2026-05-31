import { detectLocale } from "@/lib/locale/detector";
import { useMemo } from "react";

export function useLocale() {
  const locale = useMemo(() => detectLocale(), []);

  return { locale };
}
