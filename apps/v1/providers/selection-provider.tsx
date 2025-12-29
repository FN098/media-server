import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

interface SelectionContextType {
  selectedIds: Set<string | number>;
  isSelectionMode: boolean;
  isSelected: (id: string | number) => boolean;
  toggleSelection: (id: string | number) => void;
  selectIds: (ids: (string | number)[]) => void;
  clearSelection: () => void;
}

const SelectionContext = createContext<SelectionContextType | undefined>(
  undefined
);

export function SelectionProvider({ children }: { children: React.ReactNode }) {
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(
    new Set()
  );

  const isSelectionMode = selectedIds.size > 0;

  const isSelected = useCallback(
    (id: string | number) => selectedIds.has(id),
    [selectedIds]
  );

  const toggleSelection = useCallback((id: string | number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectIds = useCallback((ids: (string | number)[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const value = useMemo(
    () => ({
      selectedIds,
      isSelectionMode,
      isSelected,
      toggleSelection,
      selectIds,
      clearSelection,
    }),
    [
      selectedIds,
      isSelectionMode,
      isSelected,
      toggleSelection,
      selectIds,
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
