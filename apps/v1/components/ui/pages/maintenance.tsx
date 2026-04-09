import { cleanupGhostMediaAction } from "@/actions/media-actions";
import {
  deleteSelectedTagsAction,
  scanUnusedTagsAction,
} from "@/actions/tag-actions";
import { DatabaseBackupCard } from "@/components/ui/cards/database-backup-card";
import { GhostMediaCleanupCard } from "@/components/ui/cards/ghost-media-cleanup-card";
import { TagMasterManagerCard } from "@/components/ui/cards/tag-master-manager-card";
import { UnusedTagsCleanupCard } from "@/components/ui/cards/unused-tags-cleanup-card";

export function Maintenance() {
  return (
    <div className="p-8 space-y-6 grid gap-6 md:grid-cols-2">
      <DatabaseBackupCard />

      <GhostMediaCleanupCard onDelete={cleanupGhostMediaAction} />

      <UnusedTagsCleanupCard
        onScan={scanUnusedTagsAction}
        onDelete={deleteSelectedTagsAction}
      />

      <div className="md:col-span-2">
        <TagMasterManagerCard />
      </div>
    </div>
  );
}
