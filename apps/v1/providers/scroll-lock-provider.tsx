"use client";

import { useScrollLock } from "@/hooks/general/use-scroll-lock";
import { createContext, useContext, useEffect } from "react";

const ScrollLockContext = createContext<
  ReturnType<typeof useScrollLock> | undefined
>(undefined);

export function ScrollLockProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const value = useScrollLock();
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
