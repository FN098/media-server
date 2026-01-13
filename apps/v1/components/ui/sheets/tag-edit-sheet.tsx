import { createTagsAction, updateMediaTagsAction } from "@/actions/tag-actions";
import { useShortcutKeys } from "@/hooks/use-shortcut-keys";
import { MediaNode } from "@/lib/media/types";
import { normalizeTagName } from "@/lib/tag/normalize";
import {
  PendingNewTag,
  Tag,
  TagOperation,
  TagOperator,
  TagState,
} from "@/lib/tag/types";
import { useTagEditorContext } from "@/providers/tag-editor-provider";
import { Badge } from "@/shadcn/components/ui/badge";
import { Button } from "@/shadcn/components/ui/button";
import { Slider } from "@/shadcn/components/ui/slider";
import { useIsMobile } from "@/shadcn/hooks/use-mobile";
import { cn } from "@/shadcn/lib/utils";
import { AnimatePresence, motion, useDragControls } from "framer-motion";
import {
  Check,
  Edit2,
  Eye,
  Plus,
  RotateCcw,
  Save,
  TagIcon,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

export type TagEditMode = "default" | "single" | "none";

export function TagEditSheet({
  targetNodes,
  mode = "default",
  opacity: initialOpacity,
  edit,
  onClose,
}: {
  targetNodes: MediaNode[];
  mode?: TagEditMode;
  opacity?: number;
  edit?: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const editor = useTagEditorContext();
  const controls = useDragControls();
  const isMobile = useIsMobile();
  const canEdit = targetNodes.length > 0;

  // 対象が変更されたらコンテキストに反映
  useEffect(() => {
    editor.setTargetNodes(targetNodes);
  }, [editor, targetNodes]);

  // 編集モード
  const [isEditing, setIsEditing] = useState(edit ?? false);
  const toggleIsEditing = () => setIsEditing((prev) => !prev);
  // useEffect(() => {
  //   if (edit !== undefined) {
  //     setIsEditing(edit);
  //   }
  // }, [edit]);

  // 透明モード
  const [opacity, setOpacity] = useState(initialOpacity ?? editor.opacity);
  // useEffect(() => {
  //   if (initialOpacity !== undefined) {
  //     setOpacity(initialOpacity);
  //   }
  // }, [initialOpacity]);

  const handleChangeOpacity = (opacity: number) => {
    setOpacity(opacity);
    editor.setOpacity(opacity);
  };

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

  // 編集モードに移行
  const handleEdit = () => {
    setIsEditing(true);
  };

  // 保存処理
  const [isLoading, startTransition] = useTransition();
  const handleApply = () => {
    startTransition(async () => {
      if (isLoading || !editor.hasChanges) return;

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

        await editor.invalidateTags();
        router.refresh();

        handleTerminate();
      }
    });
  };

  // 終了処理
  const handleTerminate = () => {
    // 編集モードなら閲覧モードに移行（閉じない）
    if (isEditing) {
      setIsEditing(false);
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
    },
    {
      key: "e",
      callback: () => toggleIsEditing(),
      condition: () => canEdit,
    },
  ]);

  return (
    <>
      {/* 暗転オーバーレイ */}
      {isEditing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/40"
          onClick={handleTerminate}
        />
      )}

      {/* メインコンテナ */}
      <motion.div
        layout
        drag="y"
        dragControls={controls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={(_, info) => {
          // 下スワイプ: 終了
          if (info.velocity.y > 300 || info.offset.y > 100) {
            handleTerminate();
          }
          // 上スワイプ: 編集
          else if (info.velocity.y < -300 || info.offset.y < -100) {
            if (canEdit) {
              handleEdit();
            }
          }
        }}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className={cn(
          "fixed bottom-0 left-1/2 -translate-x-1/2 z-[70]",
          "w-full max-w-md",
          "pointer-events-auto select-none",
          "rounded-t-[24px] pb-safe overflow-visible"
        )}
      >
        {/* 背景レイヤー */}
        <div
          className="absolute inset-0 -bottom-[300px] -z-10 rounded-t-[24px] bg-background border border-b-0 border-border"
          style={{
            backgroundColor: `color-mix(in oklch, var(--background), transparent)`,
            backdropFilter: opacity > 0 ? `blur(${opacity / 10}px)` : "none",
          }}
        />

        <div className="relative rounded-t-[24px] pb-safe">
          {/* ハンドル（つまみ） */}
          <div
            className="w-full pt-4 pb-2 cursor-grab active:cursor-grabbing touch-none"
            onPointerDown={(e) => controls.start(e)}
          >
            <div
              className={cn("w-12 h-1.5 bg-muted/40 rounded-full mx-auto")}
            />
          </div>

          {/* コンテンツエリア */}
          <div className="px-4 pb-6 overflow-y-auto max-h-[85vh]">
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
                    count={targetNodes.length}
                    isEditing={false}
                    opacity={opacity}
                    canEdit={canEdit}
                    onClose={handleTerminate}
                    onEditClick={handleEdit}
                    onOpacityChange={handleChangeOpacity}
                  />
                  <TagList
                    isEditing={false}
                    tags={editor.viewModeTags}
                    pendingChanges={editor.pendingChanges}
                    pendingNewTags={editor.pendingNewTags}
                    tagStates={editor.tagStates}
                    onToggle={editor.toggleTagChange}
                    opacity={opacity}
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
                    count={targetNodes.length}
                    isEditing={true}
                    opacity={opacity}
                    canEdit={canEdit}
                    onEditClick={() => {}}
                    onClose={handleTerminate}
                    onOpacityChange={handleChangeOpacity}
                  />
                  <TagInput
                    value={editor.newTagName}
                    opacity={opacity}
                    disabled={isLoading}
                    autoFocus={isMobile ? false : true}
                    suggestions={editor.suggestedTags}
                    onChange={editor.setNewTagName}
                    onAdd={() => handleNewAdd(editor.newTagName)}
                    onSelectSuggestion={editor.selectSuggestion}
                    onApply={handleApply}
                    onCancel={handleTerminate}
                  />
                  <TagList
                    isEditing={true}
                    tags={editor.editModeTags}
                    pendingChanges={editor.pendingChanges}
                    pendingNewTags={editor.pendingNewTags}
                    tagStates={editor.tagStates}
                    onToggle={editor.toggleTagChange}
                    opacity={opacity}
                  />
                  <SheetFooter
                    onReset={editor.resetChanges}
                    onApply={handleApply}
                    hasChanges={editor.hasChanges}
                    isLoading={isLoading}
                    opacity={opacity}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </>
  );
}

function SheetHeader({
  mode,
  count,
  isEditing,
  canEdit,
  opacity,
  onOpacityChange,
  onEditClick,
  onClose,
}: {
  mode: TagEditMode;
  count: number;
  isEditing: boolean;
  canEdit: boolean;
  opacity: number;
  onOpacityChange: (val: number) => void;
  onEditClick: () => void;
  onClose: () => void;
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
    <div
      className="flex items-center gap-3 w-full"
      style={{
        color: `color-mix(in oklch, var(--secondary-foreground) ${Math.max(70, opacity)}%, transparent)`,
      }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <div className="p-1.5 rounded-full bg-primary/10 shrink-0">
          <TagIcon size={16} />
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1">
            <h3 className="text-sm font-bold truncate leading-none">{title}</h3>
            {!isEditing && (
              <Button
                size="icon"
                variant="ghost"
                className="h-5 w-5 p-0 hover:bg-primary/10 shrink-0"
                onClick={onEditClick}
                disabled={!canEdit}
              >
                <Edit2 size={12} />
              </Button>
            )}
          </div>
          {selection && (
            <p className="text-[9px] text-muted-foreground truncate line-clamp-1">
              {selection}
            </p>
          )}
        </div>
      </div>

      <div
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg border border-border/40 flex-1 max-w-[120px] ml-auto"
        style={{
          backgroundColor: `color-mix(in oklch, var(--muted) 5%, transparent)`,
        }}
      >
        <Eye size={12} className="text-muted-foreground/60 shrink-0" />
        <Slider
          value={[opacity]}
          min={0}
          max={100}
          onValueChange={(vals) => onOpacityChange(vals[0])}
          className={cn(
            "flex-1 cursor-pointer",
            "[&_[data-slot=slider-track]]:bg-muted/30",
            "[&_[data-slot=slider-range]]:bg-transparent",
            "[&_[data-slot=slider-thumb]]:size-3 [&_[data-slot=slider-thumb]]:bg-muted-foreground/80 [&_[data-slot=slider-thumb]]:border-none"
          )}
        />
        <span className="text-[9px] font-mono text-muted-foreground/80 tabular-nums shrink-0">
          {opacity}
        </span>
      </div>

      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8 rounded-full bg-muted/20 hover:bg-muted/40 shrink-0"
        onClick={onClose}
      >
        <X size={18} />
      </Button>
    </div>
  );
}

function TagInput({
  value,
  disabled,
  suggestions,
  autoFocus,
  onChange,
  onAdd,
  onSelectSuggestion,
  onApply,
  onCancel,
}: {
  value: string;
  disabled: boolean;
  suggestions: Tag[];
  autoFocus?: boolean;
  opacity: number;
  onChange: (val: string) => void;
  onAdd: () => void;
  onSelectSuggestion: (tag: Tag) => void;
  onApply: () => void;
  onCancel: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const suggests = useMemo(
    () => new Map(suggestions.map((s) => [s.name, s])),
    [suggestions]
  );
  const [activeIndex, setActiveIndex] = useState(-1);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const selectIndex = (index: number) => {
    const nextIndex = Math.max(0, Math.min(index, suggestions.length - 1));
    setActiveIndex(nextIndex);

    const el = itemRefs.current[nextIndex];
    if (el) {
      el?.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        selectIndex(activeIndex + 1);
        break;

      case "ArrowUp":
        e.preventDefault();
        selectIndex(activeIndex - 1);
        break;

      case "Escape":
        e.preventDefault();
        setActiveIndex(-1);

        if (!value) {
          onCancel();
        }
        break;

      case "Enter":
        e.preventDefault();

        // タグが選択されていればそれを入力
        if (activeIndex >= 0) {
          const tag = suggestions[activeIndex];
          if (!tag) return;
          onSelectSuggestion(tag);
          inputRef.current?.focus();
          setActiveIndex(-1);
          return;
        }

        // 何も入力されていない場合は確定操作とみなす
        if (!value.trim()) {
          onApply();
          setActiveIndex(-1);
          return;
        }

        // サジェストに一致する場合は選択
        const normalized = normalizeTagName(value);
        if (suggests.has(normalized)) {
          onSelectSuggestion(suggests.get(value)!);
          setActiveIndex(-1);
          return;
        }

        // 新規作成
        onAdd();
        onChange("");
        setActiveIndex(-1);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          autoFocus={autoFocus}
          className="w-full bg-muted/50 border-none rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 ring-primary/20 outline-none"
          placeholder="新しいタグを入力..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
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
              {suggestions.map((tag, index) => {
                const active = index === activeIndex;

                return (
                  <button
                    key={tag.id}
                    ref={(el) => {
                      itemRefs.current[index] = el;
                    }}
                    type="button"
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => {
                      onSelectSuggestion(tag);
                      inputRef.current?.focus();
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-between",
                      active ? "bg-accent" : "hover:bg-accent"
                    )}
                  >
                    <span>{tag.name}</span>
                    <Check
                      size={14}
                      className={cn(
                        "text-primary transition-opacity",
                        active ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TagList({
  opacity,
  isEditing,
  tags,
  pendingChanges,
  pendingNewTags,
  tagStates,
  onToggle,
}: {
  opacity: number;
  isEditing: boolean;
  tags: Tag[];
  pendingChanges: Record<string, TagOperator>;
  pendingNewTags: PendingNewTag[];
  tagStates: Record<string, TagState>;
  onToggle: (tag: Tag) => void;
}) {
  // --- 閲覧モード ---
  if (!isEditing) {
    return (
      <div
        style={
          {
            "--scrollbar-color": `color-mix(in oklch, var(--muted-foreground) ${Math.max(20, opacity * 0.5)}%, transparent)`,
          } as React.CSSProperties
        }
        className={cn(
          "flex flex-wrap gap-2 max-h-[40vh] overflow-y-auto py-1 pr-1",
          "[&::-webkit-scrollbar]:w-1.5",
          "[&::-webkit-scrollbar-track]:bg-transparent",
          "[&::-webkit-scrollbar-thumb]:bg-[var(--scrollbar-color)]",
          "[&::-webkit-scrollbar-thumb]:rounded-full"
        )}
      >
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
                      "py-2 px-4 rounded-xl text-xs border-none",
                      "select-text cursor-text"
                    )}
                    style={{
                      backgroundColor: `color-mix(in oklch, var(--secondary) ${opacity}%, transparent)`,
                      color: `color-mix(in oklch, var(--secondary-foreground) ${Math.max(70, opacity)}%, transparent)`,
                    }}
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
    <div
      style={
        {
          "--scrollbar-color": `color-mix(in oklch, var(--muted-foreground) ${Math.max(20, opacity * 0.5)}%, transparent)`,
        } as React.CSSProperties
      }
      className={cn(
        "flex flex-wrap gap-2 max-h-[40vh] overflow-y-auto py-1 px-1",
        "[&::-webkit-scrollbar]:w-1.5",
        "[&::-webkit-scrollbar-track]:bg-transparent",
        "[&::-webkit-scrollbar-thumb]:bg-[var(--scrollbar-color)]",
        "[&::-webkit-scrollbar-thumb]:rounded-full"
      )}
    >
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
              "relative flex items-center gap-1.5 py-2 px-4 rounded-xl text-xs font-medium transition-all active:scale-95 border-none",
              isHighlighted
                ? "text-primary-foreground shadow-md shadow-primary/20"
                : "text-muted-foreground",
              op === "add" && "ring-2 ring-yellow-400 ring-offset-2",
              op === "remove" && "opacity-40 line-through",
              isPendingNew &&
                "border-2 border-dashed border-primary/60 text-primary"
            )}
            style={{
              backgroundColor: isHighlighted
                ? `color-mix(in oklch, var(--primary) ${opacity}%, transparent)`
                : `color-mix(in oklch, var(--muted) ${opacity}%, transparent)`,

              color: isHighlighted
                ? `color-mix(in oklch, var(--primary-foreground) ${Math.max(80, opacity)}%, transparent)`
                : undefined,
            }}
          >
            <span className="flex items-center gap-1.5 pointer-events-none">
              {isOnAfterApply && <Check size={12} />}
              {tag.name}
            </span>

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
  hasChanges,
  isLoading,
  onReset,
  onApply,
}: {
  hasChanges: boolean;
  isLoading: boolean;
  opacity: number;
  onReset: () => void;
  onApply: () => void;
}) {
  return (
    <div className="flex gap-3 pt-2">
      <Button
        variant="outline"
        className={cn("flex-1 h-12 rounded-xl gap-2")}
        onClick={onReset}
        disabled={!hasChanges || isLoading}
      >
        <RotateCcw size={16} /> リセット
      </Button>
      <Button
        className={cn(
          "flex-[2] h-12 rounded-xl gap-2 shadow-lg shadow-primary/25"
        )}
        onClick={onApply}
        disabled={!hasChanges || isLoading}
      >
        <Save size={16} /> {isLoading ? "保存中..." : "変更を保存"}
      </Button>
    </div>
  );
}
