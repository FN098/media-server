"use client";

import { useScrollLockControl } from "@/hooks/use-scroll-lock";
import { createContext, useContext, useEffect } from "react";

type ScrollLockContextType = ReturnType<typeof useScrollLockControl>;

const ScrollLockContext = createContext<ScrollLockContextType | undefined>(
  undefined
);

export function ScrollLockProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const value = useScrollLockControl();
  const { lock, unlock } = value;

  // マウント時にロックし、アンマウント時にアンロック
  useEffect(() => {
    lock();
    return () => unlock();
  }, [lock, unlock]);

  return (
    <ScrollLockContext.Provider value={value}>
      {children}
    </ScrollLockContext.Provider>
  );
}

export function useScrollLockContext() {
  const context = useContext(ScrollLockContext);
  if (context === undefined) {
    throw new Error(
      "useScrollLockContext must be used within ScrollLockProvider"
    );
  }
  return context;
}
