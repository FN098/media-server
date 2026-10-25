"use client";

import { formatRecentDate } from "@/__lib/utils/date";
import { useMounted } from "@/feature/etc/hooks/use-mounted";
import { useMemo } from "react";

interface LocalRecentDateProps {
  value: string | Date | null;
  // locale: string; // サポート対象外
  fallback?: string;
}

export function LocalRecentDate({ value, fallback }: LocalRecentDateProps) {
  const mounted = useMounted();
  const formatted = useMemo(
    () => (value && mounted && formatRecentDate(value, fallback)) || fallback,
    [fallback, mounted, value]
  );

  return <>{formatted}</>;
}
