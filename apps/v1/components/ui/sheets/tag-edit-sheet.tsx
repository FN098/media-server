import { createTagsAction, updateMediaTagsAction } from "@/actions/tag-actions";
import { Record } from "@/generated/prisma/runtime/library";
import { useShortcutKeys } from "@/hooks/use-shortcut-keys";
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
import { Badge } from "@/shadcn/components/ui/badge";
import { Button } from "@/shadcn/components/ui/button";
import { cn } from "@/shadcn/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Edit2, Plus, RotateCcw, Save, TagIcon, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

export function TagEditSheet({
  targetNodes,
  mode = "default",
  active,
  transparent,
  edit,
  onClose,
}: {
  targetNodes: MediaNode[];
  mode?: TagEditMode;
  active?: boolean;
  transparent?: boolean;
  edit?: boolean;
  onClose?: () => void;
}) {
  const router = useRouter();
  const editor = useTagEditor(targetNodes);

  // 編集モード
  const [isEditing, setIsEditing] = useState(edit ?? false);
  const toggleIsEditing = () => setIsEditing((prev) => !prev);
  useEffect(() => {
    if (edit !== undefined) {
      setIsEditing(edit);
    }
  }, [edit]);

  // 透明モード
  const [isTransparent, setIsTransparent] = useState(transparent ?? false);
  const toggleIsTransparent = () => setIsTransparent((prev) => !prev);
  useEffect(() => {
    if (transparent !== undefined) {
      setIsTransparent(transparent);
    }
  }, [transparent]);

  // 処理中
  const [isLoading, setIsLoading] = useState(false);

  // 新規作成
  const handleNewAdd = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    // 既に存在すれば「追加候補」
    const existing = editor.editModeTags.find((t) => t.name === trimmed);
    if (existing) {
      editor.setTagChange(existing, "add");
      editor.setNewTagName("");
      return;
    }

    // 存在しない場合は仮タグとしてメモリに積む
    editor.addPendingNewTag(trimmed);
    editor.setNewTagName("");
  };

  // 編集
  const handleEditClick = () => {
    setIsEditing(true);
    setIsTransparent(false); // 編集モードでは不透明
  };

  // 保存
  const handleApply = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      // 仮タグを DB 作成
      const created = await createTagsAction(
        editor.pendingNewTags.map((t) => t.name)
      );
      if (!created.success) throw new Error(created.error);

      // 新規タグの操作
      const createdOps: TagOperation[] = created.tags.map((tag) => ({
        tagId: tag.id,
        operator: "add",
      }));

      // 既存タグの操作
      const existingOps: TagOperation[] = Object.entries(
        editor.pendingChanges
      ).map(([tagId, operator]) => ({
        tagId,
        operator,
      }));

      // マージ
      const operations = [...existingOps, ...createdOps];
      if (operations.length === 0) return;

      // 紐づけ実行
      const result = await updateMediaTagsAction({
        mediaPaths: targetNodes.map((n) => n.path),
        operations,
      });

      if (result.success) {
        toast.success("保存しました");
        editor.resetChanges();
        setIsEditing(mode !== "single");
        await editor.refreshTags();
        router.refresh();
        if (mode === "default") handleTerminate();
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 終了
  const handleTerminate = () => {
    // 編集モードなら閲覧モードに移行（閉じない）
    if (isEditing) {
      setIsEditing(false);
      setIsTransparent(true); // 閲覧モードでは透明
      return;
    }

    // 閲覧モードなら閉じる
    onClose?.();
  };

  // ショートカット
  useShortcutKeys([
    {
      key: "Escape",
      callback: () => handleTerminate(),
      condition: () => active ?? false,
    },
    {
      key: "e",
      callback: () => toggleIsEditing(),
      condition: () => active ?? false,
    },
    {
      key: "x",
      callback: () => toggleIsTransparent(),
      condition: () => active ?? false,
    },
  ]);

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
              onClick={handleTerminate}
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
                      isTransparent={isTransparent}
                      count={targetNodes.length}
                      onClose={handleTerminate}
                      onToggleTransparent={toggleIsTransparent}
                      onEditClick={handleEditClick}
                    />
                    <TagList
                      isEditing={false}
                      tags={editor.viewModeTags}
                      pendingChanges={editor.pendingChanges}
                      pendingNewTags={editor.pendingNewTags}
                      tagStates={editor.tagStates}
                      onToggle={editor.toggleTagChange}
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
                      count={targetNodes.length}
                      onEditClick={() => {}}
                      onClose={handleTerminate}
                      isTransparent={isTransparent}
                      onToggleTransparent={toggleIsTransparent}
                    />
                    <TagInput
                      value={editor.newTagName}
                      onChange={editor.setNewTagName}
                      onAdd={() => handleNewAdd(editor.newTagName)}
                      disabled={isLoading}
                      suggestions={editor.suggestedTags}
                      onSelectSuggestion={editor.selectSuggestion}
                      isTransparent={isTransparent}
                    />
                    <TagList
                      isEditing={true}
                      tags={editor.editModeTags}
                      pendingChanges={editor.pendingChanges}
                      pendingNewTags={editor.pendingNewTags}
                      tagStates={editor.tagStates}
                      onToggle={editor.toggleTagChange}
                      isTransparent={isTransparent}
                    />
                    <SheetFooter
                      onReset={editor.resetChanges}
                      onApply={() => void handleApply()}
                      hasChanges={editor.hasChanges}
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
      <div className="flex flex-wrap gap-2 py-2 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {tags.length > 0 ? (
            <motion.div
              key="tags-container"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-wrap gap-2 w-full"
            >
              {tags.map((tag, index) => (
                <motion.div
                  key={tag.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.15, delay: index * 0.03 }}
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
              ))}
            </motion.div>
          ) : (
            <motion.p
              key="empty-message"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="text-sm text-muted-foreground py-2 w-full text-center italic"
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

        const isOnAfterApply =
          op === "add"
            ? true
            : op === "remove"
              ? false
              : tagStates[tag.name] === "all";

        const isPartiallyOn = op == null && tagStates[tag.name] === "some";
        const isHighlighted = isOnAfterApply || isPartiallyOn;
        const isPendingNew = pendingNewTags.some((t) => t.tempId === tag.id);

        return (
          <button
            key={tag.id}
            onClick={() => onToggle(tag)}
            className={cn(
              "relative flex items-center gap-1.5 py-2 px-4 rounded-xl text-xs font-medium transition-all active:scale-95",
              isHighlighted
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "bg-muted text-muted-foreground",
              op === "add" && "ring-2 ring-yellow-400 ring-offset-2",
              op === "remove" && "opacity-40 line-through",
              isPendingNew &&
                "border-2 border-dashed border-primary/60 bg-primary/10 text-primary",
              isTransparent && (isHighlighted ? "bg-primary/50" : "bg-muted/50")
            )}
          >
            {isOnAfterApply && <Check size={12} />}
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
