import { DatabaseBackupCard } from "@/feature/maintenance/components/db-backup/ui/database-backup-card";
import { GhostMediaCleanupCard } from "@/feature/maintenance/components/ghost-media/ui/ghost-media-cleanup-card";
import { GhostTagsCleanupCard } from "@/feature/maintenance/components/ghost-tag/ui/ghost-tags-cleanup-card";
import { GhostThumbCleanupCard } from "@/feature/maintenance/components/ghost-thumbnail/ui/ghost-thumb-cleanup-card";
import { TagMasterProvider } from "@/feature/maintenance/components/tag-master/providers/tag-master-provider";
import { TagMasterManagerCard } from "@/feature/maintenance/components/tag-master/ui/tag-master-manager-card";

export function Maintenance() {
  return (
    <div className="p-2 space-y-6 grid gap-6 md:grid-cols-2 w-full">
      <DatabaseBackupCard />
      <GhostTagsCleanupCard />

      <GhostMediaCleanupCard />
      <GhostThumbCleanupCard />

      <div className="md:col-span-2">
        <TagMasterProvider>
          <TagMasterManagerCard />
        </TagMasterProvider>
      </div>
    </div>
  );
}
