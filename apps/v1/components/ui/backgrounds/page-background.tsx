"use client";

import { AmbientBackground } from "@/components/ui/backgrounds/ambient-background";
import { GalaxyBackground } from "@/components/ui/backgrounds/galaxy-background";
import { useMounted } from "@/hooks/general/use-mounted";
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
