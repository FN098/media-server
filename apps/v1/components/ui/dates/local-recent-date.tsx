"use client";

import { formatRecentDate } from "@/lib/utils/formatter";
import { useEffect, useState } from "react";

export function LocalRecentDate({ value }: { value: string | Date | null }) {
  const [text, setText] = useState("-");

  useEffect(() => {
    setText(formatRecentDate(value));
  }, [value]);

  return <>{text}</>;
}
