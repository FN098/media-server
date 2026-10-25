import { useTagEditSheetContext } from "@/app/(pages)/(tag-editor)/_providers/tag-edit-sheet-provider";
import { useDetectMobileContext } from "@/feature/mobile/providers/mobile-provider";
import { EditingMode, TagEditMode } from "@/lib/tag-editor/types";
import { normalizeTagName } from "@/lib/tag/normalize";
import { Tag, TagOperator, TagState } from "@/lib/tag/types";
import { Badge } from "@/shadcn/components/ui/badge";
import { Button } from "@/shadcn/components/ui/button";
import { Label } from "@/shadcn/components/ui/label";
import { Switch } from "@/shadcn/components/ui/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shadcn/components/ui/tabs";
import { cn } from "@/shadcn/lib/utils";
import { AnimatePresence, motion, useDragControls } from "framer-motion";
import {
  Check,
  Clock,
  Eye,
  EyeOff,
  Plus,
  RotateCcw,
  Save,
  Star,
  TagIcon,
  X,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";

export function TagEditSheet() {
  const {
    isOpen,
    canEdit,
    editingMode,
    targetNodes,
    opacity,
    tagEditor,
    isLoading,
    handleReset,
    handleClose,
    handleModeChangeDown,
    handleModeChangeUp,
    handleModeChange,
    handleOpacityChange,
    handleApply,
    handleNewAdd,
  } = useTagEditSheetContext();

  const controls = useDragControls();
  const isMobile = useDetectMobileContext();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 暗転オーバーレイ */}
          {(editingMode === "edit" || editingMode === "quick") && (
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/40"
              onClick={handleReset}
            />
          )}

          {/* メインコンテナ */}
          <motion.div
            key="main-sheet"
            layout
            drag="y"
            dragControls={controls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              // 下スワイプ: 終了
              if (info.velocity.y > 300 || info.offset.y > 100) {
                handleModeChangeDown();
              }
              // 上スワイプ: 編集
              else if (info.velocity.y < -300 || info.offset.y < -100) {
                if (canEdit) {
                  handleModeChangeUp();
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
                backdropFilter:
                  opacity > 0 ? `blur(${opacity / 10}px)` : "none",
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
                  {/* 閲覧モード */}
                  {editingMode === "view" && (
                    <motion.div
                      key="view-mode-panel"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="space-y-4"
                    >
                      <SheetHeader
                        mode={tagEditor.mode}
                        count={targetNodes.length}
                        editingMode={editingMode}
                        onModeChange={handleModeChange}
                        opacity={opacity}
                        onClose={handleClose}
                        onOpacityChange={handleOpacityChange}
                      />
                      <TagList
                        isEditing={false}
                        tags={tagEditor.relatedTags}
                        pendingChanges={tagEditor.pendingChanges}
                        pendingNewTags={tagEditor.pendingNewTags}
                        tagStates={tagEditor.tagStates}
                        onToggle={tagEditor.toggleTagChange}
                        opacity={opacity}
                      />
                    </motion.div>
                  )}

                  {/* クイックモード */}
                  {editingMode === "quick" && (
                    <motion.div
                      key="quick-mode-panel"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="space-y-4"
                    >
                      <SheetHeader
                        mode={tagEditor.mode}
                        count={targetNodes.length}
                        editingMode={editingMode}
                        onModeChange={handleModeChange}
                        opacity={opacity}
                        onClose={handleClose}
                        onOpacityChange={handleOpacityChange}
                      />
                      <TagList
                        isEditing={true}
                        tags={tagEditor.relatedTags}
                        pendingChanges={tagEditor.pendingChanges}
                        pendingNewTags={tagEditor.pendingNewTags}
                        tagStates={tagEditor.tagStates}
                        onToggle={tagEditor.toggleTagChange}
                        opacity={opacity}
                      />
                      <Tabs defaultValue="recent" className="w-full">
                        <TabsList className="w-full h-10">
                          <TabsTrigger value="recent" className="gap-2">
                            <Clock className="size-3.5" />
                            最近使用
                          </TabsTrigger>
                          <TabsTrigger value="favorite" className="gap-2">
                            <Star className="size-3.5" />
                            お気に入り
                          </TabsTrigger>
                        </TabsList>

                        <div className="mt-2 min-h-[150px] max-h-[150px] overflow-auto">
                          <TabsContent
                            value="recent"
                            className="mt-0 outline-none"
                          >
                            <TagList
                              isEditing={true}
                              tags={tagEditor.recentTags}
                              pendingChanges={tagEditor.pendingChanges}
                              pendingNewTags={tagEditor.pendingNewTags}
                              tagStates={tagEditor.tagStates}
                              onToggle={tagEditor.toggleTagChange}
                              opacity={opacity}
                            />
                          </TabsContent>
                          <TabsContent
                            value="favorite"
                            className="mt-0 outline-none"
                          >
                            <TagList
                              isEditing={true}
                              tags={tagEditor.favoriteTags}
                              pendingChanges={tagEditor.pendingChanges}
                              pendingNewTags={tagEditor.pendingNewTags}
                              tagStates={tagEditor.tagStates}
                              onToggle={tagEditor.toggleTagChange}
                              opacity={opacity}
                            />
                          </TabsContent>
                        </div>
                      </Tabs>
                      <SheetFooter
                        onReset={tagEditor.discardChanges}
                        onApply={() => void handleApply()}
                        hasChanges={tagEditor.hasChanges}
                        isLoading={isLoading}
                      />
                    </motion.div>
                  )}

                  {/* 詳細モード */}
                  {editingMode === "edit" && (
                    <motion.div
                      key="edit-mode-panel"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="space-y-4"
                    >
                      <SheetHeader
                        mode={tagEditor.mode}
                        count={targetNodes.length}
                        editingMode={editingMode}
                        onModeChange={handleModeChange}
                        opacity={opacity}
                        onClose={handleClose}
                        onOpacityChange={handleOpacityChange}
                      />
                      <TagInput
                        value={tagEditor.newTagName}
                        disabled={isLoading}
                        autoFocus={!isMobile}
                        autoBlur={isMobile}
                        suggestions={tagEditor.suggestedTags}
                        onChange={tagEditor.setNewTagName}
                        onAdd={() => handleNewAdd(tagEditor.newTagName)}
                        onSelectSuggestion={tagEditor.selectSuggestion}
                        onApply={() => void handleApply()}
                        onCancel={handleReset}
                      />
                      <TagList
                        isEditing={true}
                        tags={tagEditor.editModeTags}
                        pendingChanges={tagEditor.pendingChanges}
                        pendingNewTags={tagEditor.pendingNewTags}
                        tagStates={tagEditor.tagStates}
                        onToggle={tagEditor.toggleTagChange}
                        opacity={opacity}
                      />
                      <SheetFooter
                        onReset={tagEditor.discardChanges}
                        onApply={() => void handleApply()}
                        hasChanges={tagEditor.hasChanges}
                        isLoading={isLoading}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

interface SheetHeaderProps {
  mode: TagEditMode;
  onModeChange: (mode: EditingMode) => void;
  count: number;
  editingMode: EditingMode;
  opacity: number;
  onOpacityChange: (val: number) => void;
  onClose: () => void;
}

function SheetHeader({
  mode,
  onModeChange,
  count,
  editingMode,
  opacity,
  onOpacityChange,
  onClose,
}: SheetHeaderProps) {
  const textMap = {
    single: {
      "edit-title": "タグを編集",
      "view-title": "タグ一覧",
      selection: "",
    },
    default: {
      "edit-title": "一括タグ編集",
      "view-title": "タグ一覧",
      selection: `${count}件を選択中`,
    },
    none: {
      "edit-title": "",
      "view-title": "",
      selection: "",
    },
  } as const;

  const title =
    textMap[mode][editingMode !== "view" ? "edit-title" : "view-title"];
  const selection = textMap[mode]["selection"];

  const isBlur = opacity > 50;

  return (
    <div className="flex flex-col items-center justify-between w-full px-2 gap-4">
      <div className="flex items-center justify-between w-full h-12 px-2 gap-4">
        {/* タイトルエリア */}
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/10 shrink-0 text-primary border border-primary/10 shadow-inner">
            <TagIcon size={16} className="stroke-[2.5]" />
          </div>
          <div className="flex flex-col min-w-0">
            <h3 className="text-sm font-extrabold truncate leading-tight tracking-tight text-foreground/90">
              {title}
            </h3>
            {selection && (
              <p className="text-[10px] text-muted-foreground truncate opacity-90 font-medium">
                {selection}
              </p>
            )}
          </div>
        </div>

        {/* ブラースイッチ */}
        <div className="flex items-center gap-3 shrink-0 sm:ml-auto">
          <Label
            htmlFor="blur-switch"
            className="flex items-center gap-2.5 cursor-pointer"
          >
            <div
              className={cn(
                "p-1.5 rounded-lg border transition-all shadow-sm",
                isBlur
                  ? "bg-sky-500/10 border-sky-500/30 text-sky-500"
                  : "bg-background/10 border-border text-muted-foreground/60"
              )}
            >
              {isBlur ? (
                <Eye size={16} className="stroke-[2.5]" />
              ) : (
                <EyeOff size={16} className="stroke-[2.5]" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-foreground/90 select-none leading-tight">
                背景ブラー
              </span>
              <span className="text-[9px] text-muted-foreground/80 select-none font-medium">
                {isBlur ? "ON (100%)" : "OFF (0%)"}
              </span>
            </div>
          </Label>

          <Switch
            id="blur-switch"
            checked={isBlur}
            onCheckedChange={(checked) => onOpacityChange(checked ? 100 : 0)}
            className={cn(
              "scale-100",
              "data-[state=checked]:bg-sky-500 data-[state=unchecked]:bg-input",
              "border border-sky-600/20 shadow-inner"
            )}
          />
        </div>

        {/* 閉じるボタン */}
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 rounded-full hover:bg-muted/80 hover:text-foreground text-muted-foreground/80 transition-all opacity-60 group-hover:opacity-100"
          onClick={onClose}
        >
          <X size={18} className="stroke-[2.5]" />
        </Button>
      </div>

      {/* モード切り替えスイッチ */}
      <div className="flex w-full sm:w-auto gap-0.5 bg-background/10 border border-border/60 rounded-full p-1 shadow-md">
        {(["view", "quick", "edit"] as const).map((m) => {
          const isActive = editingMode === m;
          return (
            <button
              key={m}
              onClick={() => onModeChange(m)}
              className={cn(
                "text-[11px] px-5 py-2 rounded-full transition-all duration-300 ease-out flex-1 sm:flex-none whitespace-nowrap",
                "font-bold uppercase tracking-widest leading-none text-[11px]",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md scale-105"
                  : "text-muted-foreground/80 hover:text-foreground hover:bg-muted/50"
              )}
            >
              {{ view: "View", quick: "Quick", edit: "Detail" }[m]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface SheetFooterProps {
  hasChanges: boolean;
  isLoading: boolean;
  onReset: () => void;
  onApply: () => void;
}

function SheetFooter({
  hasChanges,
  isLoading,
  onReset,
  onApply,
}: SheetFooterProps) {
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

interface TagListProps {
  opacity: number;
  isEditing: boolean;
  tags: Tag[];
  pendingChanges: Record<string, TagOperator>;
  pendingNewTags: Tag[];
  tagStates: Record<string, TagState>;
  onToggle: (tag: Tag) => void;
}

function TagList({
  opacity,
  isEditing,
  tags,
  pendingChanges,
  pendingNewTags,
  tagStates,
  onToggle,
}: TagListProps) {
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
        "flex flex-wrap gap-2 max-h-[40vh] overflow-y-auto p-2",
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
        const isPendingNew = pendingNewTags.some((t) => t.id === tag.id);

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
              {/* {isOnAfterApply && <Check size={12} />} */}
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

interface TagInputProps {
  value: string;
  disabled: boolean;
  suggestions: Tag[];
  autoFocus?: boolean;
  autoBlur?: boolean; // autoFocus と排反 (focus 優先)
  onChange: (val: string) => void;
  onAdd: () => void;
  onSelectSuggestion: (tag: Tag) => void;
  onApply: () => void;
  onCancel: () => void;
}

function TagInput({
  value,
  disabled,
  suggestions,
  autoFocus,
  autoBlur,
  onChange,
  onAdd,
  onSelectSuggestion,
  onApply,
  onCancel,
}: TagInputProps) {
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

  const updateInputFocus = () => {
    if (autoFocus) {
      inputRef.current?.focus();
    } else if (autoBlur) {
      inputRef.current?.blur();
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
          if (tag) {
            onSelectSuggestion(tag);
            setActiveIndex(-1);
            updateInputFocus();
            return;
          }
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
          updateInputFocus();
          return;
        }

        // 新規作成
        onAdd();
        onChange("");
        setActiveIndex(-1);
        updateInputFocus();
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          autoFocus={autoFocus}
          className="w-full bg-muted/50 border-none rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 ring-primary/20 outline-none"
          placeholder="タグを入力..."
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
            key="tag-suggestions"
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
                      setActiveIndex(-1);
                      updateInputFocus();
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
