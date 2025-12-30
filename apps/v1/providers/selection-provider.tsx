import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

interface SelectionContextType {
  selectedValues: Set<string>;
  isSelectionMode: boolean;
  isSelected: (value: string) => boolean;
  toggleSelection: (value: string) => void;
  selectValues: (values: string[]) => void;
  clearSelection: () => void;
}

const SelectionContext = createContext<SelectionContextType | undefined>(
  undefined
);

export function SelectionProvider({ children }: { children: React.ReactNode }) {
  const [selectedValues, setSelectedValues] = useState<Set<string>>(new Set());

  const isSelectionMode = selectedValues.size > 0;

  const isSelected = useCallback(
    (value: string) => selectedValues.has(value),
    [selectedValues]
  );

  const toggleSelection = useCallback((id: string) => {
    setSelectedValues((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectValues = useCallback((ids: string[]) => {
    setSelectedValues(new Set(ids));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedValues(new Set());
  }, []);

  const value = useMemo(
    () => ({
      selectedValues,
      isSelectionMode,
      isSelected,
      toggleSelection,
      selectValues,
      clearSelection,
    }),
    [
      selectedValues,
      isSelectionMode,
      isSelected,
      toggleSelection,
      selectValues,
      clearSelection,
    ]
  );

  return (
    <SelectionContext.Provider value={value}>
      {children}
    </SelectionContext.Provider>
  );
}

export const useSelection = () => {
  const context = useContext(SelectionContext);
  if (!context)
    throw new Error("useSelection must be used within SelectionProvider");
  return context;
};
