"use client";

import { useTagMaster } from "@/feature/pages/maintenance/components/tag-master/hooks/use-tag-master";
import { createContext, ReactNode, useContext } from "react";

const TagMasterContext = createContext<
  ReturnType<typeof useTagMaster> | undefined
>(undefined);

interface TagMasterProvider {
  children: ReactNode;
}

export function TagMasterProvider({ children }: TagMasterProvider) {
  const value = useTagMaster();

  return (
    <TagMasterContext.Provider value={value}>
      {children}
    </TagMasterContext.Provider>
  );
}

export function useTagMasterContext() {
  const context = useContext(TagMasterContext);
  if (context === undefined) {
    throw new Error(
      "useTagMasterContext must be used within TagMasterProvider"
    );
  }
  return context;
}
