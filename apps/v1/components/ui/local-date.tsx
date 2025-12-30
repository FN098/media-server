"use client";

import { formatLocalDate, formatRecentDate } from "@/lib/utils/formatter";
import { useEffect, useState } from "react";

export function LocalDateValue({ value }: { value: string | Date | null }) {
  const [text, setText] = useState("-");

  useEffect(() => {
    setText(formatLocalDate(value));
  }, [value]);

  return <>{text}</>;
}

export function LocalRecentDateValue({
  value,
}: {
  value: string | Date | null;
}) {
  const [text, setText] = useState("-");

  useEffect(() => {
    setText(formatRecentDate(value));
  }, [value]);

  return <>{text}</>;
}
