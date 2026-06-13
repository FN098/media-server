"use client";

import { TextWithTooltip } from "@/components/ui/texts/text-with-tooltip";
import { useMoveDialog } from "@/hooks/dialogs/use-move-dialog";
import { Button } from "@/shadcn/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shadcn/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shadcn/components/ui/tabs";
import { cn } from "@/shadcn/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Folder,
  FolderInput,
  Pin,
} from "lucide-react";
import { useState } from "react";

interface MoveDialogProps {
  dialog: ReturnType<typeof useMoveDialog>;
}

export function MoveDialog({ dialog }: MoveDialogProps) {
  const {
    isOpen,
    initialDir,
    currentDir,
    dirs,
    recentDirs,
    isLoading,
    isPending,
    close,
    changeDir,
    goBackParent,
    togglePin,
    performMove,
  } = dialog;

  const [activeTab, setActiveTab] = useState<string>("browse");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent
        className="sm:max-w-[425px] h-[540px] flex flex-col"
        onEscapeKeyDown={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle>移動先を選択</DialogTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground break-all bg-muted p-2 rounded">
            <Folder className="h-4 w-4 shrink-0" />
            {currentDir}
          </div>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col min-h-0"
        >
          <TabsList className="grid w-full grid-cols-2 shrink-0 mb-2">
            <TabsTrigger value="browse">通常ブラウズ</TabsTrigger>
            <TabsTrigger value="recent" className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              最近のフォルダ
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="browse"
            className="flex-1 min-h-0 m-0 data-[state=active]:flex data-[state=active]:flex-col gap-2"
          >
            {currentDir !== "" && (
              <Button
                variant="ghost"
                className="w-full justify-start text-primary shrink-0"
                onClick={goBackParent}
                disabled={isLoading}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                上の階層へ
              </Button>
            )}

            <div className="flex-1 min-h-0 relative border rounded-md overflow-y-auto h-full p-2">
              {isLoading && (
                <div className="absolute inset-0 bg-background/50 z-20 flex items-center justify-center backdrop-blur-[1px]">
                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              )}

              <div className="flex flex-col gap-1 w-full min-w-0">
                {dirs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    このフォルダにサブフォルダはありません
                  </div>
                ) : (
                  dirs.map((dir) => (
                    <Button
                      key={dir.path}
                      variant="ghost"
                      className="w-full min-w-0 justify-between hover:bg-primary/10 group gap-2"
                      onClick={() => changeDir(dir.path)}
                      disabled={isLoading}
                    >
                      <div className="flex items-center min-w-0 text-left">
                        <Folder className="mr-2 h-4 w-4 text-blue-500 shrink-0" />
                        <TextWithTooltip
                          text={dir.name}
                          className="max-w-full truncate"
                        />
                      </div>

                      <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" />
                    </Button>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent
            value="recent"
            className="flex-1 min-h-0 m-0 data-[state=active]:flex data-[state=active]:flex-col gap-2"
          >
            <div className="flex-1 min-h-0 relative border rounded-md overflow-y-auto h-full p-2">
              {isLoading && (
                <div className="absolute inset-0 bg-background/50 z-20 flex items-center justify-center backdrop-blur-[1px]">
                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              )}

              <div className="flex flex-col gap-1 w-full min-w-0">
                {recentDirs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    最近訪問したフォルダはありません
                  </div>
                ) : (
                  recentDirs.map((dir) => (
                    <div
                      key={dir.path}
                      className="flex items-center justify-between w-full group gap-1"
                    >
                      {/* フォルダボタン */}
                      <Button
                        variant="ghost"
                        className="flex-1 min-w-0 justify-start hover:bg-primary/10 py-6"
                        onClick={() => {
                          changeDir(dir.path);
                          setActiveTab("browse");
                        }}
                        disabled={isLoading}
                      >
                        <div className="flex items-center min-w-0 w-full">
                          <Folder className="mr-2 h-4 w-4 text-amber-500 shrink-0" />
                          <div className="flex flex-col items-start min-w-0 text-left w-full">
                            <TextWithTooltip
                              text={dir.name}
                              className="max-w-full truncate"
                            />
                            <TextWithTooltip
                              text={dir.path}
                              className="text-xs text-muted-foreground max-w-full truncate"
                            />
                          </div>
                        </div>
                      </Button>

                      {/* ピン留めボタン */}
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={isLoading}
                        className={cn(
                          "h-8 w-8 text-muted-foreground/50 hover:text-primary transition-opacity shrink-0",
                          !dir.pinned &&
                            "opacity-0 group-hover:opacity-100 focus:opacity-100"
                        )}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          void togglePin(dir.path, dir.pinned);
                        }}
                      >
                        <Pin
                          className={cn(
                            "w-3.5 h-3.5 transition-transform duration-200",
                            dir.pinned
                              ? "fill-primary text-primary"
                              : "rotate-45"
                          )}
                        />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2 pt-2 border-t">
          <Button
            variant="outline"
            onClick={close}
            disabled={isLoading || isPending}
          >
            キャンセル
          </Button>
          <Button
            onClick={() => void performMove()}
            disabled={isLoading || isPending || currentDir === initialDir}
          >
            {isPending ? (
              "移動中..."
            ) : (
              <>
                <FolderInput className="mr-2 h-4 w-4" />
                ここに移動
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
