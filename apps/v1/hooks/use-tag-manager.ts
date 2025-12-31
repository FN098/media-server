import { Tag } from "@/generated/prisma";
import { useTagSelection } from "@/hooks/use-tag-selection";
import { useTags } from "@/hooks/use-tags";
import { MediaNode } from "@/lib/media/types";
import { TagOperator } from "@/lib/tag/types";
import { uniqueBy } from "@/lib/utils/unique";
import { TagEditMode } from "@/lib/view/types";
import { useCallback, useMemo, useState } from "react";

export function useTagManager(
  targetNodes: MediaNode[],
  initialMode: TagEditMode
) {
  const [mode, setMode] = useState(initialMode);
  const [newTagName, setNewTagName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [createdTags, setCreatedTags] = useState<Tag[]>([]);
  const [pendingChanges, setPendingChanges] = useState<
    Record<string, TagOperator>
  >({});
  const [isEditing, setIsEditing] = useState(false);

  // targetNodesからパスを抽出（APIコールや状態計算に利用）
  const targetPaths = useMemo(
    () => targetNodes.map((n) => n.path),
    [targetNodes]
  );
  const {
    tags: masterTags,
    refreshTags,
    isLoading: isLoadingTags,
  } = useTags(targetPaths);
  const { tagStates } = useTagSelection(targetNodes, masterTags);

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
          // 「既に全員が持っている」なら「削除候補」、「それ以外」なら「追加候補」
          next[tag.id] = dbState === "all" ? "remove" : "add";
        }
        return next;
      });
    },
    [tagStates]
  );

  const setTagChange = useCallback((tag: Tag, op: TagOperator) => {
    setPendingChanges((prev) => {
      return { ...prev, [tag.id]: op };
    });
  }, []);

  const resetChanges = useCallback(() => {
    setPendingChanges({});
    setCreatedTags([]);
  }, []);

  return {
    targetPaths,
    mode,
    setMode,
    newTagName,
    setNewTagName,
    isLoading,
    setIsLoading,
    displayMasterTags,
    isLoadingTags,
    tagStates,
    pendingChanges,
    setPendingChanges,
    isEditing,
    setIsEditing,
    hasChanges,
    toggleTag,
    setTagChange,
    resetChanges,
    refreshTags,
    masterTags,
  };
}
