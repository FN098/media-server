import { detectLocale } from "@/__lib/utils/locale";
import { useState } from "react";

export function useLocale() {
  const [locale] = useState(() => detectLocale());

  return { locale };
}
