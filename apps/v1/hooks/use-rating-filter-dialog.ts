import { RatingFilterValue } from "@/lib/filter/types";
import { useCallback, useState } from "react";

export type RatingFilterDialogContext =
  | {
      isOpen: true;
      currentValue: RatingFilterValue;
    }
  | { isOpen: false };

interface UseRatingFilterDialogProps {
  onChange?: (context: RatingFilterDialogContext) => void;
}

export function useRatingFilterDialog({
  onChange,
}: UseRatingFilterDialogProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentValue, setCurrentValue] = useState<RatingFilterValue>({
    mode: "all",
  });

  const open = useCallback(
    (value: RatingFilterValue) => {
      onChange?.({
        isOpen: true,
        currentValue: value,
      });
      setCurrentValue(value);
      setIsOpen(true);
    },
    [onChange]
  );

  const close = useCallback(() => {
    onChange?.({ isOpen: false });
    setIsOpen(false);
  }, [onChange]);

  return {
    currentValue,
    isOpen,
    open,
    close,
  };
}
