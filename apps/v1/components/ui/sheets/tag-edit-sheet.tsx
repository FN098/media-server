import { SheetFooter } from "@/components/ui/sheets/tag-edit-sheet/seet-footer";
import { SheetHeader } from "@/components/ui/sheets/tag-edit-sheet/seet-header";
import { TagInput } from "@/components/ui/sheets/tag-edit-sheet/tag-input";
import { TagList } from "@/components/ui/sheets/tag-edit-sheet/tag-list";
import { useDetectMobileContext } from "@/providers/mobile-provider";
import { useTagEditSheetContext } from "@/providers/tag-edit-sheet-provider";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shadcn/components/ui/tabs";
import { cn } from "@/shadcn/lib/utils";
import { AnimatePresence, motion, useDragControls } from "framer-motion";
import { Clock, Star } from "lucide-react";

export function TagEditSheet() {
  const {
    isOpen,
    canEdit,
    editingMode,
    targetNodes,
    opacity,
    tagEditor,
    isLoading,
    resetEditingMode,
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
              onClick={resetEditingMode}
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
                        canEdit={canEdit}
                        onClose={handleClose}
                        onEditClick={handleModeChangeUp}
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
                        canEdit={canEdit}
                        onClose={handleClose}
                        onEditClick={handleModeChangeUp}
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
                        onReset={tagEditor.resetChanges}
                        onApply={() => void handleApply()}
                        hasChanges={tagEditor.hasChanges}
                        isLoading={isLoading}
                        opacity={opacity}
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
                        canEdit={canEdit}
                        onEditClick={() => {}}
                        onClose={handleClose}
                        onOpacityChange={handleOpacityChange}
                      />
                      <TagInput
                        value={tagEditor.newTagName}
                        opacity={opacity}
                        disabled={isLoading}
                        autoFocus={!isMobile}
                        autoBlur={isMobile}
                        suggestions={tagEditor.suggestedTags}
                        onChange={tagEditor.setNewTagName}
                        onAdd={() => handleNewAdd(tagEditor.newTagName)}
                        onSelectSuggestion={tagEditor.selectSuggestion}
                        onApply={() => void handleApply()}
                        onCancel={resetEditingMode}
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
                        onReset={tagEditor.resetChanges}
                        onApply={() => void handleApply()}
                        hasChanges={tagEditor.hasChanges}
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
      )}
    </AnimatePresence>
  );
}
