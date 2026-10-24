"use client";

import { createAppQueryClient } from "@/app/(pages)/_lib/cache/_lib/factory";
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
