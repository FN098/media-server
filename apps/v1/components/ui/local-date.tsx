"use client";

import { formatLocalDate } from "@/lib/utils/formatter";
import { useEffect, useState } from "react";

export function LocalDateValue({ value }: { value: string | Date | null }) {
  const [text, setText] = useState("-");

  useEffect(() => {
    setText(formatLocalDate(value));
  }, [value]);

  return <>{text}</>;
}
