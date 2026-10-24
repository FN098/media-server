"use client";

import { AmbientBackground } from "@/app/(pages)/_components/background/ambient-background";
import { GalaxyBackground } from "@/app/(pages)/_components/background/galaxy-background";
import { useMounted } from "@/feature/general/hooks/use-mounted";
import { useTheme } from "next-themes";
import { AccentColor } from "../../_lib/accent-color";

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
