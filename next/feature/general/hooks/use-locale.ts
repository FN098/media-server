import { detectLocale } from "@/lib/utils/locale";
import { useState } from "react";

export function useLocale() {
  const [locale] = useState(() => detectLocale());

  return { locale };
}
