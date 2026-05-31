"use client";

import { useMounted } from "@/hooks/general/use-mounted";
import { useMemo } from "react";

interface LocalDateProps {
  value: string | Date | null;
  locale: string;
  fallback?: string;
}

export function LocalDate({ value, locale, fallback = "-" }: LocalDateProps) {
  const mounted = useMounted();
  const formatted = useMemo(
    () => (value && mounted && formatDate(new Date(value), locale)) || fallback,
    [fallback, locale, mounted, value]
  );

  return <>{formatted}</>;
}

function formatDate(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}
