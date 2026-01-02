import { createTagsAction, updateMediaTagsAction } from "@/actions/tag-actions";
import { Record } from "@/generated/prisma/runtime/library";
import { useTagEditor } from "@/hooks/use-tag-editor";
import { MediaNode } from "@/lib/media/types";
import { normalizeTagName } from "@/lib/tag/normalize";
import {
  PendingNewTag,
  Tag,
  TagEditMode,
  TagOperation,
  TagOperator,
  TagState,
} from "@/lib/tag/types";
import { useSelection } from "@/providers/selection-provider";
import { useShortcutKeys } from "@/providers/shortcut-provider-old";
import { Badge } from "@/shadcn/components/ui/badge";
import { Button } from "@/shadcn/components/ui/button";
import { cn } from "@/shadcn/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Edit2, Plus, RotateCcw, Save, TagIcon, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";

export function TagEditSheet({
  allNodes,
  active,
  onClose,
}: {
  allNodes: MediaNode[];
  active: boolean;
  onClose?: () => void;
}) {
  const router = useRouter();

  // タグエディターステート
  const {
    mode,
    setMode,
    isEditing,
    setIsEditing,
    isLoading,
    setIsLoading,
    newTagName,
    setNewTagName,
    pendingNewTags,
    addPendingNewTag,
    pendingChanges,
    hasChanges,
    toggleTag,
    setTagChange,
    tagStates,
    suggestedTags,
    selectSuggestion,
    editModeTags,
    viewModeTags,
    refreshTags,
    resetChanges,
    isTransparent,
    setIsTransparent,
  } = useTagEditor(allNodes);

  // パス選択ステート
  const {
    selectedValues: selectedPaths,
    selectValues: selectPaths,
    clearSelection,
  } = useSelection();

  // 透明モードトグル
  const toggleTransparent = () => setIsTransparent((prev) => !prev);

  // 保存処理
  const handleApply = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      // 仮タグを DB 作成
      const created = await createTagsAction(pendingNewTags.map((t) => t.name));
      if (!created.success) throw new Error(created.error);

      // 新規タグの操作
      const createdOps: TagOperation[] = created.tags.map((tag) => ({
        tagId: tag.id,
        operator: "add",
      }));

      // 既存タグの操作
      const existingOps: TagOperation[] = Object.entries(pendingChanges).map(
        ([tagId, operator]) => ({
          tagId,
          operator,
        })
      );

      // マージ
      const operations = [...existingOps, ...createdOps];
      if (operations.length === 0) return;

      // 紐づけ実行
      const result = await updateMediaTagsAction({
        mediaPaths: Array.from(selectedPaths),
        operations,
      });

      if (result.success) {
        toast.success("保存しました");
        await refreshTags();
        router.refresh();
        handleClose();
      }
    } finally {
      setIsLoading(false);
    }
  };

  // タグ追加処理
  const handleAddTag = () => {
    const name = newTagName.trim();
    if (!name) return;

    // 既に存在すれば「追加候補」
    const existing = editModeTags.find((t) => t.name === name);
    if (existing) {
      setTagChange(existing, "add");
      setNewTagName("");
      return;
    }

    // 仮タグとしてメモリに積む
    addPendingNewTag(name);
    setNewTagName("");
  };

  // 閉じる処理（正常終了）
  const handleClose = () => {
    setIsEditing(false);
    setMode("none");
    clearSelection();
    resetChanges();
    onClose?.();
  };

  useShortcutKeys([
    { key: "Escape", callback: handleClose },
    { key: "e", callback: () => setIsEditing((prev) => !prev) },
  ]);

  // モードの設定
  useEffect(() => {
    if (active && allNodes.length === 1) {
      setMode("single");
    } else if (active && allNodes.length > 1) {
      setMode("default");
    } else {
      setMode("none");
    }
  }, [active, allNodes.length, setMode]);

  // シングルモードの場合は自動選択
  useEffect(() => {
    if (mode === "single") {
      selectPaths([allNodes[0].path]);
    }
  }, [allNodes, mode, selectPaths]);

  return (
    <AnimatePresence>
      {active && (
        <div className="fixed inset-0 z-[70] pointer-events-none flex flex-col justify-end">
          {/* 暗転オーバーレイ */}
          {isEditing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 pointer-events-auto"
              onClick={handleClose}
            />
          )}

          {/* メインエディター */}
          <motion.div
            layout
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={cn(
              "relative w-full bg-background border-t rounded-t-[24px] shadow-2xl pointer-events-auto pb-safe overflow-hidden",
              isTransparent && "bg-background/20"
            )}
          >
            <div className="w-12 h-1.5 bg-muted/20 rounded-full mx-auto mt-3 mb-2" />

            <div className="px-4 pb-6">
              <AnimatePresence mode="wait">
                {!isEditing ? (
                  /* --- 閲覧ビュー --- */
                  <motion.div
                    key="view-mode"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="space-y-4"
                  >
                    <SheetHeader
                      mode={mode}
                      isEditing={false}
                      count={selectedPaths.size}
                      onEditClick={() => setIsEditing(true)}
                      onClose={handleClose}
                      isTransparent={isTransparent}
                      onToggleTransparent={toggleTransparent}
                    />
                    <TagList
                      isEditing={false}
                      tags={viewModeTags}
                      pendingChanges={pendingChanges}
                      pendingNewTags={pendingNewTags}
                      tagStates={tagStates}
                      onToggle={toggleTag}
                      isTransparent={isTransparent}
                    />
                  </motion.div>
                ) : (
                  /* --- 編集ビュー --- */
                  <motion.div
                    key="edit-mode"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="space-y-4"
                  >
                    <SheetHeader
                      mode={mode}
                      isEditing={true}
                      count={selectedPaths.size}
                      onEditClick={() => {}}
                      onClose={handleClose}
                      isTransparent={isTransparent}
                      onToggleTransparent={toggleTransparent}
                    />
                    <TagInput
                      value={newTagName}
                      onChange={setNewTagName}
                      onAdd={() => void handleAddTag()}
                      disabled={isLoading}
                      suggestions={suggestedTags}
                      onSelectSuggestion={selectSuggestion}
                      isTransparent={isTransparent}
                    />
                    <TagList
                      isEditing={true}
                      tags={editModeTags}
                      pendingChanges={pendingChanges}
                      pendingNewTags={pendingNewTags}
                      tagStates={tagStates}
                      onToggle={toggleTag}
                      isTransparent={isTransparent}
                    />
                    <SheetFooter
                      onReset={resetChanges}
                      onApply={() => void handleApply()}
                      hasChanges={hasChanges}
                      isLoading={isLoading}
                      isTransparent={isTransparent}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
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
  isTransparent,
  onToggleTransparent,
}: {
  mode: TagEditMode;
  isEditing: boolean;
  count: number;
  onEditClick: () => void;
  onClose: () => void;
  isTransparent: boolean;
  onToggleTransparent: () => void;
}) {
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
        <Button
          size="sm"
          variant="ghost"
          className={cn(
            "h-10 w-10 p-0 rounded-full",
            isTransparent &&
              "text-primary-foreground bg-background/20 hover:bg-accent"
          )}
          onClick={onToggleTransparent}
        >
          <TagIcon />
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <h3
              className={cn(
                "text-sm font-bold",
                isTransparent && "text-primary-foreground"
              )}
            >
              {title}
            </h3>
            {!isEditing && (
              <Button
                size="sm"
                variant="ghost"
                className={cn(
                  "text-primary hover:bg-primary/5 p-1 rounded-md transition-colors ml-2",
                  isTransparent &&
                    "text-primary-foreground bg-background/20 hover:bg-accent"
                )}
                onClick={onEditClick}
              >
                <Edit2 size={14} />
              </Button>
            )}
          </div>
          <p
            className={cn(
              "text-[10px] text-muted-foreground",
              isTransparent && "text-primary-foreground"
            )}
          >
            {selection}
          </p>
        </div>
      </div>

      <Button
        size="sm"
        variant="ghost"
        className={cn(
          "h-10 w-10 p-0 rounded-full",
          isTransparent &&
            "text-primary-foreground bg-background/20 hover:bg-accent"
        )}
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
  isTransparent,
}: {
  value: string;
  onChange: (val: string) => void;
  onAdd: () => void;
  disabled: boolean;
  suggestions: Tag[];
  onSelectSuggestion: (tag: Tag) => void;
  isTransparent: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const suggests = useMemo(
    () => new Map(suggestions.map((s) => [s.name, s])),
    [suggestions]
  );

  useShortcutKeys([{ key: "i", callback: () => inputRef.current?.focus() }]);

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
            if (e.key === "Enter" && !e.nativeEvent.isComposing) {
              e.preventDefault();

              if (!value.trim()) return;

              const normalized = normalizeTagName(value);

              // サジェストに一致する場合は選択、なければ新規作成
              if (suggests.has(normalized)) {
                onSelectSuggestion(suggests.get(value)!);
              } else {
                onAdd();
                onChange("");
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
            className={cn([
              // layout
              "absolute right-2 top-1/2 -translate-y-1/2",

              // base style
              "bg-primary text-primary-foreground",
              "px-3 py-1 rounded-lg text-xs font-medium",

              // focus (keyboard)
              "focus-visible:outline-none",
              "focus-visible:ring-2 focus-visible:ring-primary",
              "focus-visible:ring-offset-2 focus-visible:ring-offset-background",

              isTransparent && "bg-primary/50",
            ])}
          >
            新規作成
          </button>
        )}
      </div>

      {/* サジェストリスト */}
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
                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-primary-foreground-foreground rounded-lg transition-colors flex items-center justify-between group"
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
  pendingNewTags,
  tagStates,
  onToggle,
  isTransparent,
}: {
  isEditing: boolean;
  tags: Tag[];
  pendingChanges: Record<string, TagOperator>; // key: tagId
  pendingNewTags: PendingNewTag[];
  tagStates: Record<string, TagState>; // key: tagId
  onToggle: (tag: Tag) => void;
  isTransparent: boolean;
}) {
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
                  className={cn(
                    "py-2 px-4 rounded-lg text-xs",
                    isTransparent && "bg-secondary/50"
                  )}
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
        const isPendingNew = pendingNewTags.some((t) => t.tempId === tag.id);

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
              op === "remove" && "opacity-40 line-through",
              isPendingNew &&
                "border-2 border-dashed border-primary/60 bg-primary/10 text-primary",
              isTransparent && (willBeOn ? "bg-primary/50" : "bg-muted/50")
            )}
          >
            {willBeOn && <Check size={12} />}
            {tag.name}
            {op && (
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-yellow-400 rounded-full border-2 border-background" />
            )}
            {isPendingNew && (
              <span className="absolute -top-1 -right-1 rounded-full bg-primary px-1.5 text-[9px] font-bold text-primary-foreground shadow">
                NEW
              </span>
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
  isTransparent,
}: {
  onReset: () => void;
  onApply: () => void;
  hasChanges: boolean;
  isLoading: boolean;
  isTransparent: boolean;
}) {
  return (
    <div className="flex gap-3 pt-2">
      <Button
        variant="outline"
        className={cn(
          "flex-1 h-12 rounded-xl gap-2",
          isTransparent && "bg-secondary/50"
        )}
        onClick={onReset}
        disabled={!hasChanges || isLoading}
      >
        <RotateCcw size={16} /> リセット
      </Button>
      <Button
        className={cn(
          "flex-[2] h-12 rounded-xl gap-2 shadow-lg shadow-primary/25",
          isTransparent && "bg-primary/50"
        )}
        onClick={onApply}
        disabled={!hasChanges || isLoading}
      >
        <Save size={16} /> {isLoading ? "保存中..." : "変更を保存"}
      </Button>
    </div>
  );
}
