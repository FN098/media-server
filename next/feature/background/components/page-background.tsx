"use client";

import { AmbientBackground } from "@/feature/background/components/ambient-background";
import { GalaxyBackground } from "@/feature/background/components/galaxy-background";
import { useMounted } from "@/feature/etc/hooks/use-mounted";
import { AccentColor } from "@/feature/theme/lib/accent-color";
import { useTheme } from "next-themes";

interface PageBackgroundProps {
  accent: AccentColor;
}

export function PageBackground({ accent }: PageBackgroundProps) {
  const { theme } = useTheme();
  const mounted = useMounted();

  const effectiveTheme = (mounted ? theme : null) ?? "dark";

  switch (effectiveTheme) {
    case "dark":
      return <GalaxyBackground accent={accent} />;
    default:
      return <AmbientBackground accent={accent} />;
  }
}
