"use client";

import { createAppQueryClient } from "@/feature/cache/lib/query-client";
import { QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function AppQueryClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [client] = useState(createAppQueryClient);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
