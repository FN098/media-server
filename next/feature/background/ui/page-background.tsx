"use client";

import { AmbientBackground } from "@/feature/background/ui/ambient-background";
import { GalaxyBackground } from "@/feature/background/ui/galaxy-background";
import { useMounted } from "@/feature/general/hooks/use-mounted";
import { AccentColor, BackgroundType } from "@/lib/page-meta/types";
import { useTheme } from "next-themes";

interface PageBackgroundProps {
  backgroundType: Record<string, BackgroundType>;
  accent: AccentColor;
}

export function PageBackground({
  accent,
  backgroundType,
}: PageBackgroundProps) {
  const { theme } = useTheme();
  const mounted = useMounted();

  const effectiveTheme = (mounted ? theme : null) ?? "dark";

  switch (backgroundType[effectiveTheme]) {
    case "galaxy":
      return <GalaxyBackground accent={accent} />;
    default:
      return <AmbientBackground accent={accent} />;
  }
}
