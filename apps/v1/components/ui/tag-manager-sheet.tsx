import { createTagAction, updateMediaTagsAction } from "@/actions/tag-actions";
import { SelectionBar } from "@/components/ui/selection-bar";
import type { Tag } from "@/generated/prisma";
import { useTagManager } from "@/hooks/use-tag-manager";
import { MediaNode } from "@/lib/media/types";
import { TagOperation, TagOperator } from "@/lib/tag/types";
import { TagEditMode, TagState } from "@/lib/view/types";
import { useSelection } from "@/providers/selection-provider";
import { useShortcutKeys } from "@/providers/shortcut-provider";
import { Badge } from "@/shadcn/components/ui/badge";
import { Button } from "@/shadcn/components/ui/button";
import { cn } from "@/shadcn/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Edit2, Plus, RotateCcw, Save, TagIcon, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
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
  suggestions: Tag[];
  onSelectSuggestion: (tag: Tag) => void;
}

interface TagListProps {
  isEditing: boolean;
  isLoading?: boolean;
  tags: Tag[];
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

  const targetNodes = useMemo(() => {
    if (mode === "single" && allNodes.length === 1) return allNodes;
    return allNodes.filter((n) => selectedPaths.has(n.path));
  }, [allNodes, selectedPaths, mode]);

  const router = useRouter();
  const tm = useTagManager(targetNodes, mode);

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

    // 既に存在すれば「追加候補」
    const existing = tm.editModeTags.find((t) => t.name === name);
    if (existing) {
      tm.setTagChange(existing, "add");
      tm.setNewTagName("");
      return;
    }

    // マスタータグ追加
    tm.setIsLoading(true);
    try {
      const result = await createTagAction(name);
      if (result.success && result.tag) {
        tm.setPendingChanges((prev) => ({ ...prev, [result.tag.id]: "add" }));
        tm.setNewTagName("");
        tm.addCreatedTag(result.tag);
      }
    } finally {
      tm.setIsLoading(false);
    }
  };

  // 閉じる処理
  const handleClose = () => {
    if (tm.isEditing) {
      tm.setIsEditing(false);
      return;
    }

    tm.setMode("none");
    clearSelection();
    onClose?.();
  };

  // 全選択処理
  const handleSelectAll = () => {
    const paths = allNodes.map((n) => n.path);
    selectPaths(paths);
  };

  const showSelectionBar =
    mode === "default" && !tm.isEditing && isSelectionMode;

  const showMainsheet =
    (mode === "default" && tm.isEditing) || mode === "single";

  useShortcutKeys([{ key: "Escape", callback: handleClose }]);

  return (
    <>
      <AnimatePresence>
        {/* --- 1. 選択バー (タグ編集に依存しない独立した部品へ) --- */}
        {showSelectionBar && (
          <SelectionBar
            key="selection-bar"
            count={selectedPaths.size}
            totalCount={allNodes.length}
            onSelectAll={handleSelectAll}
            onCancel={clearSelection}
            actions={
              <>
                {/* 将来的にここへ <Button>ダウンロード</Button> 等を追加可能 */}
                <Button
                  variant="default"
                  size="sm"
                  className="rounded-xl text-xs h-10 px-5 font-bold shadow-lg"
                  onClick={() => tm.setIsEditing(true)}
                >
                  タグ編集
                </Button>
              </>
            }
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {/* --- 2. メインシート (閲覧モード or 編集モード) --- */}
        {showMainsheet && (
          <div className="fixed inset-0 z-[70] pointer-events-none flex flex-col justify-end">
            {/* オーバーレイは編集モードのみ */}
            {tm.isEditing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/40 pointer-events-auto"
                onClick={handleClose}
              />
            )}

            <motion.div
              layout // コンテナのサイズ変化をスムーズに
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full bg-background border-t rounded-t-[24px] shadow-2xl pointer-events-auto pb-safe overflow-hidden"
            >
              <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mt-3 mb-2" />

              <div className="px-4 pb-6">
                <AnimatePresence mode="wait">
                  {!tm.isEditing ? (
                    /* --- 閲覧ビュー --- */
                    <motion.div
                      key="view-mode"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="space-y-4"
                    >
                      <SheetHeader
                        mode={mode}
                        isEditing={false}
                        count={selectedPaths.size}
                        onEditClick={() => tm.setIsEditing(true)}
                        onClose={handleClose}
                      />
                      <TagList
                        isEditing={false}
                        isLoading={tm.isLoadingTags}
                        tags={tm.viewModeTags}
                        pendingChanges={tm.pendingChanges}
                        tagStates={tm.tagStates}
                        onToggle={tm.toggleTag}
                        masterTags={tm.masterTags}
                      />
                    </motion.div>
                  ) : (
                    /* --- 編集ビュー --- */
                    <motion.div
                      key="edit-mode"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="space-y-4"
                    >
                      <SheetHeader
                        mode={mode}
                        isEditing={true}
                        count={selectedPaths.size}
                        onEditClick={() => {}}
                        onClose={handleClose}
                      />
                      <TagInput
                        value={tm.newTagName}
                        onChange={tm.setNewTagName}
                        onAdd={() => void handleAddTag()}
                        disabled={tm.isLoading}
                        suggestions={tm.suggestedTags}
                        onSelectSuggestion={tm.selectSuggestion}
                      />
                      <TagList
                        isEditing={true}
                        isLoading={tm.isLoadingTags}
                        tags={tm.editModeTags}
                        pendingChanges={tm.pendingChanges}
                        tagStates={tm.tagStates}
                        onToggle={tm.toggleTag}
                        masterTags={tm.masterTags}
                      />
                      <SheetFooter
                        onReset={tm.resetChanges}
                        onApply={() => void handleApply()}
                        hasChanges={tm.hasChanges}
                        isLoading={tm.isLoading}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
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
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 p-2 rounded-full">
          <TagIcon size={18} className="text-primary" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold">{title}</h3>
            {!isEditing && (
              <button
                onClick={onEditClick}
                className="text-primary hover:bg-primary/5 p-1 rounded-md transition-colors"
              >
                <Edit2 size={14} />
              </button>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground">{selection}</p>
        </div>
      </div>

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

function TagInput({
  value,
  onChange,
  onAdd,
  disabled,
  suggestions,
  onSelectSuggestion,
}: TagInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          className="w-full bg-muted/50 border-none rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 ring-primary/20 outline-none"
          placeholder="新しいタグを入力..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              // サジェストがある場合は一番上を選択、なければ新規作成
              if (suggestions.length > 0) {
                onSelectSuggestion(suggestions[0]);
              } else {
                onAdd();
              }
            }
          }}
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
            新規作成
          </button>
        )}
      </div>

      {/* --- サジェストリストの表示 --- */}
      <AnimatePresence>
        {suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-[80] left-0 right-0 mt-1 bg-popover border rounded-xl shadow-xl overflow-hidden"
          >
            <div className="max-h-[200px] overflow-y-auto p-1">
              <p className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                既存のタグから選択
              </p>
              {suggestions.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => onSelectSuggestion(tag)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors flex items-center justify-between group"
                >
                  <span>{tag.name}</span>
                  <Check
                    size={14}
                    className="opacity-0 group-hover:opacity-100 text-primary"
                  />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TagList({
  isEditing,
  tags,
  pendingChanges,
  tagStates,
  onToggle,
}: TagListProps) {
  // --- 閲覧モード ---
  if (!isEditing) {
    return (
      <div className="flex flex-wrap gap-2 py-2">
        <AnimatePresence>
          {tags.length > 0 ? (
            tags.map((tag, index) => (
              <motion.div
                key={tag.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{
                  opacity: 0,
                  scale: 0.9,
                  transition: { duration: 0.15 },
                }} // 消える時のアニメーション
                transition={{
                  duration: 0.2,
                  delay: index * 0.03,
                }}
                layout // これを入れると、タグが消えた後に隣のタグがスルスルと詰まる
              >
                <Badge
                  variant="secondary"
                  className="py-2 px-4 rounded-lg text-xs"
                >
                  {tag.name}
                </Badge>
              </motion.div>
            ))
          ) : (
            <motion.p
              key="empty-message" // AnimatePresence内で識別するためにkeyが必要
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sm text-muted-foreground py-4 w-full text-center italic"
            >
              タグがありません
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // --- 編集モード ---
  return (
    <div className="flex flex-wrap gap-2 max-h-[40vh] overflow-y-auto py-1">
      {tags.map((tag) => {
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
              op === "remove" && "opacity-40 line-through"
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
