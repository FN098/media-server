import { AmbientBackground } from "@/components/ui/backgrounds/ambient-background";
import { GalaxyBackground } from "@/components/ui/backgrounds/galaxy-background";
import { PageMeta } from "@/lib/page-meta/types";

export function PageBackground({ meta }: { meta: PageMeta }) {
  switch (meta.backgroundType) {
    case "galaxy":
      return <GalaxyBackground accent={meta.accent} />;
    default:
      return <AmbientBackground accent={meta.accent} />;
  }
}
