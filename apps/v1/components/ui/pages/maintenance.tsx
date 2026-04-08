import { cleanupGhostMediaAction } from "@/actions/media-actions";
import {
  deleteSelectedTagsAction,
  scanUnusedTagsAction,
} from "@/actions/tag-actions";
import { GhostMediaCleanupCard } from "@/components/ui/cards/ghost-media-cleanup-card";
import { TagRenameEditorCard } from "@/components/ui/cards/tag-rename-editor-card";
import { UnusedTagsCleanupCard } from "@/components/ui/cards/unused-tags-cleanup-card";

export function Maintenance() {
  return (
    <div className="p-8 space-y-6 grid gap-6 md:grid-cols-2">
      <GhostMediaCleanupCard onDelete={cleanupGhostMediaAction} />

      <UnusedTagsCleanupCard
        onScan={scanUnusedTagsAction}
        onDelete={deleteSelectedTagsAction}
      />

      <TagRenameEditorCard />
    </div>
  );
}
