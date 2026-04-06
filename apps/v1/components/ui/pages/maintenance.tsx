import {
  cleanupGhostMediaAction,
  scanGhostMediaAction,
} from "@/actions/media-actions";
import {
  deleteSelectedTagsAction,
  scanUnusedTagsAction,
} from "@/actions/tag-actions";
import { GhostMediaCleanupCard } from "@/components/ui/cards/ghost-media-cleanup-card";
import { UnusedTagsCleanupCard } from "@/components/ui/cards/unused-tags-cleanup-card";

export function Maintenance() {
  return (
    <div className="p-8 space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <GhostMediaCleanupCard
          autoScan={true}
          onScan={scanGhostMediaAction}
          onExecute={cleanupGhostMediaAction}
        />

        <UnusedTagsCleanupCard
          onScan={scanUnusedTagsAction}
          onExecute={deleteSelectedTagsAction}
        />
      </div>
    </div>
  );
}
