import { Tag } from "@/generated/prisma";
import { useTagSelection } from "@/hooks/use-tag-selection";
import { useTags } from "@/hooks/use-tags";
import { MediaNode } from "@/lib/media/types";
import { TagOperator } from "@/lib/tag/types";
import { uniqueBy } from "@/lib/utils/unique";
import { TagEditMode } from "@/lib/view/types";
import { useCallback, useMemo, useState } from "react";

export function useTagManager(
  allNodes: MediaNode[],
  selectedPaths: Set<string>,
  mode: TagEditMode
) {
  const [newTagName, setNewTagName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [createdTags, setCreatedTags] = useState<Tag[]>([]);
  const [pendingChanges, setPendingChanges] = useState<
    Record<string, TagOperator>
  >({});
  const [isEditing, setIsEditing] = useState(mode !== "single");

  const selectedNodes = useMemo(
    () => allNodes.filter((n) => selectedPaths.has(n.path)),
    [allNodes, selectedPaths]
  );

  const { tags: masterTags, refreshTags } = useTags(Array.from(selectedPaths));
  const { tagStates } = useTagSelection(selectedNodes, masterTags);

  const displayMasterTags = useMemo(() => {
    return uniqueBy([...masterTags, ...createdTags], "id").sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [masterTags, createdTags]);

  const hasChanges = Object.keys(pendingChanges).length > 0;

  const toggleTag = useCallback(
    (tag: Tag) => {
      const dbState = tagStates[tag.name] || "none";
      setPendingChanges((prev) => {
        const next = { ...prev };
        if (prev[tag.id]) {
          delete next[tag.id];
        } else {
          next[tag.id] = dbState === "all" ? "remove" : "add";
        }
        return next;
      });
    },
    [tagStates]
  );

  const resetChanges = useCallback(() => {
    setPendingChanges({});
    setCreatedTags([]);
  }, []);

  return {
    newTagName,
    setNewTagName,
    isLoading,
    setIsLoading,
    displayMasterTags,
    tagStates,
    pendingChanges,
    setPendingChanges,
    isEditing,
    setIsEditing,
    hasChanges,
    toggleTag,
    resetChanges,
    refreshTags,
    masterTags,
  };
}
