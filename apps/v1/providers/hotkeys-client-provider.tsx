"use client";

import { HotkeysProvider } from "react-hotkeys-hook";

// NOTE: HotkeysProvider はクライアントコンポーネントでしか使えないので、このプロバイダーでラップする
export function HotkeysClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <HotkeysProvider initiallyActiveScopes={["explorer-main"]}>
      {children}
    </HotkeysProvider>
  );
}
