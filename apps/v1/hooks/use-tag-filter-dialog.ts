import { TagFilterValue } from "@/lib/filter/types";
import { useCallback, useState } from "react";

export type TagFilterDialogContext =
  | {
      isOpen: true;
      currentValue: TagFilterValue;
    }
  | { isOpen: false };

interface UseTagFilterDialogProps {
  onChange?: (context: TagFilterDialogContext) => void;
}

export function useTagFilterDialog({ onChange }: UseTagFilterDialogProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentValue, setCurrentValue] = useState<TagFilterValue>({
    mode: "AND",
    tags: [],
  });

  const open = useCallback(
    (value: TagFilterValue) => {
      onChange?.({ isOpen: true, currentValue: value });
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
    isOpen,
    currentValue,
    open,
    close,
  };
}
