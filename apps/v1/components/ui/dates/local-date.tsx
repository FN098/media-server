"use client";

import { useMounted } from "@/hooks/general/use-mounted";
import { useMemo } from "react";

interface LocalDateProps {
  value: string | Date | null;
  locale: string;
  fallback?: string;
  showSeconds?: boolean;
}

export function LocalDate({
  value,
  locale,
  fallback = "-",
  showSeconds = false,
}: LocalDateProps) {
  const mounted = useMounted();

  const formatted = useMemo(
    () =>
      (value && mounted && formatDate(new Date(value), locale, showSeconds)) ||
      fallback,
    [fallback, locale, mounted, showSeconds, value]
  );

  return <>{formatted}</>;
}

function formatDate(date: Date, locale: string, showSeconds: boolean) {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: showSeconds ? "2-digit" : undefined,
  }).format(date);
}
