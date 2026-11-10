import { useMemo } from "react";

interface UsePercentProps {
  value: number;
  total: number;
}

export function usePercent({ value, total }: UsePercentProps) {
  return useMemo(() => {
    if (value === 0 || total === 0) return 0;
    return (value / total) * 100;
  }, [total, value]);
}
