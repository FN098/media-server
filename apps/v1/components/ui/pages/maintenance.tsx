import { DatabaseBackupCard } from "@/components/ui/cards/database-backup-card";
import { GhostMediaCleanupCard } from "@/components/ui/cards/ghost-media-cleanup-card";
import { GhostThumbCleanupCard } from "@/components/ui/cards/ghost-thumb-cleanup-card";
import { TagMasterManagerCard } from "@/components/ui/cards/tag-master-manager-card";
import { UnusedTagsCleanupCard } from "@/components/ui/cards/unused-tags-cleanup-card";

export function Maintenance() {
  return (
    <div className="py-2 space-y-6 grid gap-6 md:grid-cols-2">
      <DatabaseBackupCard />
      <UnusedTagsCleanupCard />

      <GhostMediaCleanupCard />
      <GhostThumbCleanupCard />

      <div className="md:col-span-2">
        <TagMasterManagerCard />
      </div>
    </div>
  );
}
