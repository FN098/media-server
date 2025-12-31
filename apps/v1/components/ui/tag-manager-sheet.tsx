import { createTagAction, updateMediaTagsAction } from "@/actions/tag-actions";
import { AnimatedCheckCircle } from "@/components/ui/animated-check-circle";
import type { Tag } from "@/generated/prisma";
import { useTagManager } from "@/hooks/use-tag-manager";
import { MediaNode } from "@/lib/media/types";
import { TagOperation, TagOperator } from "@/lib/tag/types";
import { TagEditMode, TagState } from "@/lib/view/types";
import { useSelection } from "@/providers/selection-provider";
import { Badge } from "@/shadcn/components/ui/badge";
import { Button } from "@/shadcn/components/ui/button";
import { cn } from "@/shadcn/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Edit2, Plus, RotateCcw, Save, TagIcon, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

interface TagManagerSheetProps {
  allNodes: MediaNode[];
  mode?: TagEditMode;
  onClose?: () => void;
}

interface SheetHeaderProps {
  mode: TagEditMode;
  isEditing: boolean;
  count: number;
  onEditClick: () => void;
  onClose: () => void;
}

interface TagInputProps {
  value: string;
  onChange: (val: string) => void;
  onAdd: () => void;
  disabled: boolean;
}

interface TagListProps {
  isEditing: boolean;
  displayTags: Tag[];
  pendingChanges: Record<string, TagOperator>; // key: tagId
  tagStates: Record<string, TagState>; // key: tagId
  onToggle: (tag: Tag) => void;
  masterTags: Tag[];
}

interface SheetFooterProps {
  onReset: () => void;
  onApply: () => void;
  hasChanges: boolean;
  isLoading: boolean;
}

interface SelectionBarProps {
  count: number;
  totalCount: number;
  onEditClick: () => void;
  onSelectAll: () => void;
  onCancel: () => void;
}

export function TagManagerSheet({
  allNodes,
  mode = "default",
  onClose,
}: TagManagerSheetProps) {
  const {
    selectedValues: selectedPaths,
    selectValues: selectPaths,
    clearSelection,
    isSelectionMode,
  } = useSelection();

  const router = useRouter();
  const tm = useTagManager(allNodes, selectedPaths, mode);

  // シングルモードの自動選択
  useEffect(() => {
    if (mode === "single" && allNodes.length === 1) {
      selectPaths([allNodes[0].path]);
    }
  }, [allNodes, mode, selectPaths]);

  // 保存処理
  const handleApply = async () => {
    if (tm.isLoading) return;
    tm.setIsLoading(true);
    try {
      const operations: TagOperation[] = Object.entries(tm.pendingChanges).map(
        ([tagId, operator]) => ({ tagId, operator })
      );
      const result = await updateMediaTagsAction({
        mediaPaths: Array.from(selectedPaths),
        operations,
      });

      if (result.success) {
        toast.success("保存しました");
        tm.setPendingChanges({});
        if (mode !== "single") clearSelection();
        tm.setIsEditing(mode !== "single");
        await tm.refreshTags();
        router.refresh();
      }
    } finally {
      tm.setIsLoading(false);
    }
  };

  // タグ追加処理
  const handleAddTag = async () => {
    const name = tm.newTagName.trim();
    if (!name) return;
    const existing = tm.displayMasterTags.find((t) => t.name === name);
    if (existing) {
      tm.toggleTag(existing);
      tm.setNewTagName("");
      return;
    }
    tm.setIsLoading(true);
    try {
      const result = await createTagAction(name);
      if (result.success && result.tag) {
        tm.setPendingChanges((prev) => ({ ...prev, [result.tag.id]: "add" }));
        tm.setNewTagName("");
      }
    } finally {
      tm.setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (tm.isEditing) {
      tm.setIsEditing(false);
      return;
    }

    tm.setMode("none");
    clearSelection();
    onClose?.();
  };

  // 全選択ハンドラ
  const handleSelectAll = () => {
    const paths = allNodes.map((n) => n.path);
    selectPaths(paths);
  };

  const showSelectionBar =
    mode === "default" && !tm.isEditing && isSelectionMode;

  const showMainsheet =
    (mode === "default" && tm.isEditing) || mode === "single";

  return (
    <AnimatePresence>
      {/* 選択バー */}
      {showSelectionBar && (
        <SelectionBar
          key="selection-bar"
          count={selectedPaths.size}
          totalCount={allNodes.length}
          onEditClick={() => tm.setIsEditing(true)}
          onSelectAll={handleSelectAll}
          onCancel={clearSelection}
        />
      )}

      {/* メインシート */}
      {showMainsheet && (
        <div className="fixed inset-0 z-[70] pointer-events-none flex flex-col justify-end">
          {/* オーバーレイ */}
          {tm.isEditing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/20 pointer-events-auto"
              onClick={() => mode !== "single" && tm.setIsEditing(false)}
            />
          )}

          {/* シート */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full bg-background border-t rounded-t-[24px] shadow-2xl pointer-events-auto pb-safe"
          >
            <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mt-3 mb-2" />

            <div className="px-4 pb-6 space-y-4">
              {/* ヘッダーセクション */}
              <SheetHeader
                mode={mode}
                isEditing={tm.isEditing}
                count={selectedPaths.size}
                onEditClick={() => tm.setIsEditing(true)}
                onClose={handleClose}
              />

              {/* 入力セクション */}
              {tm.isEditing && (
                <TagInput
                  value={tm.newTagName}
                  onChange={tm.setNewTagName}
                  onAdd={() => void handleAddTag()}
                  disabled={tm.isLoading}
                />
              )}

              {/* タグリストセクション */}
              <TagList
                isEditing={tm.isEditing}
                displayTags={tm.displayMasterTags}
                pendingChanges={tm.pendingChanges}
                tagStates={tm.tagStates}
                onToggle={tm.toggleTag}
                masterTags={tm.masterTags}
              />

              {/* フッターセクション */}
              {tm.isEditing && (
                <SheetFooter
                  onReset={tm.resetChanges}
                  onApply={() => void handleApply()}
                  hasChanges={tm.hasChanges}
                  isLoading={tm.isLoading}
                />
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function SheetHeader({
  mode,
  isEditing,
  count,
  onEditClick,
  onClose,
}: SheetHeaderProps) {
  const textMap = {
    single: {
      "edit-title": "タグを編集",
      "view-title": "タグ",
      selection: "",
    },
    default: {
      "edit-title": "一括タグ編集",
      "view-title": "タグ",
      selection: `${count}件を選択中`,
    },
    none: {
      "edit-title": "",
      "view-title": "",
      selection: "",
    },
  } as const;

  const title = textMap[mode][isEditing ? "edit-title" : "view-title"];
  const selection = textMap[mode]["selection"];

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="bg-primary/10 p-2 rounded-full">
          <TagIcon size={18} className="text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-bold">{title}</h3>
          <p className="text-[10px] text-muted-foreground">{selection}</p>
        </div>
      </div>

      {!isEditing && (
        <Button
          size="sm"
          variant="outline"
          className="rounded-full gap-1"
          onClick={onEditClick}
        >
          <Edit2 size={14} /> 編集
        </Button>
      )}

      <Button
        size="sm"
        variant="ghost"
        className="h-10 w-10 p-0 rounded-full"
        onClick={onClose}
      >
        <X size={20} />
      </Button>
    </div>
  );
}

function TagInput({ value, onChange, onAdd, disabled }: TagInputProps) {
  return (
    <div className="relative">
      <input
        className="w-full bg-muted/50 border-none rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 ring-primary/20 outline-none"
        placeholder="新しいタグを入力..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onAdd()}
        disabled={disabled}
      />
      <Plus
        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        size={18}
      />
      {value && (
        <button
          onClick={onAdd}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-lg text-xs font-medium"
        >
          追加
        </button>
      )}
    </div>
  );
}

function TagList({
  isEditing,
  displayTags,
  pendingChanges,
  tagStates,
  onToggle,
  masterTags,
}: TagListProps) {
  if (!isEditing) {
    const viewTags = masterTags.filter((tag) => tagStates[tag.name] === "all");
    return (
      <div className="flex flex-wrap gap-2 py-2">
        {viewTags.length > 0 ? (
          viewTags.map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="py-2 px-4 rounded-lg text-xs"
            >
              {tag.name}
            </Badge>
          ))
        ) : (
          <p className="text-sm text-muted-foreground py-4 w-full text-center italic">
            タグがありません
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 max-h-[40vh] overflow-y-auto py-1">
      {displayTags.map((tag) => {
        const op = pendingChanges[tag.id];
        const willBeOn =
          op === "add"
            ? true
            : op === "remove"
              ? false
              : tagStates[tag.name] === "all";
        return (
          <button
            key={tag.id}
            onClick={() => onToggle(tag)}
            className={cn(
              "relative flex items-center gap-1.5 py-2 px-4 rounded-xl text-xs font-medium transition-all active:scale-95",
              willBeOn
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "bg-muted text-muted-foreground",
              op === "add" && "ring-2 ring-yellow-400 ring-offset-2",
              op === "remove" &&
                "opacity-40 line-through decoration-destructive"
            )}
          >
            {willBeOn && <Check size={12} />}
            {tag.name}
            {op && (
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-yellow-400 rounded-full border-2 border-background" />
            )}
          </button>
        );
      })}
    </div>
  );
}

function SheetFooter({
  onReset,
  onApply,
  hasChanges,
  isLoading,
}: SheetFooterProps) {
  return (
    <div className="flex gap-3 pt-2">
      <Button
        variant="outline"
        className="flex-1 h-12 rounded-xl gap-2"
        onClick={onReset}
        disabled={!hasChanges || isLoading}
      >
        <RotateCcw size={16} /> リセット
      </Button>
      <Button
        className="flex-[2] h-12 rounded-xl gap-2 shadow-lg shadow-primary/25"
        onClick={onApply}
        disabled={!hasChanges || isLoading}
      >
        <Save size={16} /> {isLoading ? "保存中..." : "変更を保存"}
      </Button>
    </div>
  );
}

function SelectionBar({
  count,
  totalCount,
  onEditClick,
  onSelectAll,
  onCancel,
}: SelectionBarProps) {
  const isAllSelected = count > 0 && count === totalCount;

  console.log({ count, totalCount, isAllSelected });

  return (
    <motion.div
      initial={{ y: 100, x: "-50%", opacity: 0 }}
      animate={{ y: 0, x: "-50%", opacity: 1 }}
      exit={{ y: 100, x: "-50%", opacity: 0 }}
      className="fixed bottom-8 left-1/2 z-[60] w-[95%] max-w-md pointer-events-auto"
    >
      <div className="flex items-center justify-between gap-2 p-2 bg-background/80 backdrop-blur-xl border rounded-2xl shadow-2xl">
        {/* すべて選択 */}
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "rounded-xl text-xs h-10 px-3 gap-2 transition-colors",
            isAllSelected && "bg-green-500/10"
          )}
          onClick={onSelectAll}
        >
          <AnimatedCheckCircle active={isAllSelected} />
          {isAllSelected ? "全選択済み" : "すべて選択"}
        </Button>

        {/* カウント */}
        <div className="flex-1 text-center">
          <span className="text-sm font-bold">{count}</span>
          <span className="text-[10px] text-muted-foreground ml-1">
            項目を選択中
          </span>
        </div>

        {/* 右側 */}
        <div className="flex gap-1">
          <Button
            variant="default"
            size="sm"
            className="rounded-xl text-xs h-10 px-5 font-bold shadow-lg shadow-primary/20"
            onClick={onEditClick}
          >
            編集
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-xl w-10 h-10 p-0"
            onClick={onCancel}
          >
            <X size={18} />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
