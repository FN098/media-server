"use client";

import { useDynamicBreadcrumbs } from "@/feature/breadcrumbs/hooks/use-dynamic-breadcrumbs";
import { BreadcrumbLinkItem } from "@/feature/breadcrumbs/lib/types";
import { createContext, useContext } from "react";

const DynamicBreadcrumbsContext = createContext<
  ReturnType<typeof useDynamicBreadcrumbs> | undefined
>(undefined);

export function DynamicBreadcrumbsProvider({
  children,
  items,
}: {
  children: React.ReactNode;
  items: BreadcrumbLinkItem[];
}) {
  const value = useDynamicBreadcrumbs({ items });

  return (
    <DynamicBreadcrumbsContext.Provider value={value}>
      {children}
    </DynamicBreadcrumbsContext.Provider>
  );
}

export function useDynamicBreadcrumbsContext() {
  const context = useContext(DynamicBreadcrumbsContext);
  if (context === undefined) {
    throw new Error(
      "useDynamicBreadcrumbsContext must be used within DynamicBreadcrumbsProvider"
    );
  }
  return context;
}
