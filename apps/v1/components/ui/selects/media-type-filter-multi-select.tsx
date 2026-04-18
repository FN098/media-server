"use client";

import { MediaTypeFilterValue } from "@/lib/filter/types";
import { MediaFsNodeType } from "@/lib/media/types";
import { Badge } from "@/shadcn/components/ui/badge";
import { Button } from "@/shadcn/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/shadcn/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shadcn/components/ui/popover";
import { cn } from "@/shadcn/lib/utils";
import {
  Check,
  File,
  FileType,
  Film,
  Folder,
  ImageIcon,
  Music,
} from "lucide-react";
import * as React from "react";

interface MediaTypeFilterMultiSelectProps {
  value: MediaTypeFilterValue;
  onChange: (value: MediaTypeFilterValue) => void;
  className?: string;
  displayTypes?: MediaFsNodeType[];
}

const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType }> =
  {
    directory: { label: "フォルダ", icon: Folder },
    image: { label: "画像", icon: ImageIcon },
    video: { label: "動画", icon: Film },
    audio: { label: "オーディオ", icon: Music },
    file: { label: "その他のファイル", icon: File },
  };

export function MediaTypeFilterMultiSelect({
  value,
  onChange,
  className,
  displayTypes = ["directory", "image", "video", "audio", "file"],
}: MediaTypeFilterMultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const [selectedTypes, setSelectedTypes] = React.useState<MediaFsNodeType[]>(
    value.types
  );

  // Popoverが開かれた時に、現在の値でバッファを同期する
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setSelectedTypes(value.types);
    }
    setOpen(open);
  };

  const toggleOption = (type: MediaFsNodeType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const selectAll = () => setSelectedTypes(displayTypes);
  const clearAll = () => setSelectedTypes([]);

  const handleApply = () => {
    onChange({ types: selectedTypes });
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("h-9 flex items-center gap-2 w-full", className)}
        >
          {/* プレースホルダー */}
          {value.types.length === 0 && (
            <>
              <FileType className="h-4 w-4 shrink-0" />
              <span className="text-sm font-medium">種別で絞り込む</span>
            </>
          )}
          {/* 選択中 */}
          {value.types.length > 0 && (
            <>
              <div className="hidden h-4 w-px bg-border lg:block" />
              <div className="flex gap-1 overflow-hidden">
                {value.types.length > 2 ? (
                  <Badge
                    variant="secondary"
                    className="px-1 font-normal whitespace-nowrap"
                  >
                    {value.types.length} 選択中
                  </Badge>
                ) : (
                  value.types.map((t) => {
                    const Icon = TYPE_CONFIG[t].icon;
                    return (
                      <Badge
                        variant="secondary"
                        key={t}
                        className="px-1 font-normal whitespace-nowrap"
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {TYPE_CONFIG[t]?.label}
                      </Badge>
                    );
                  })
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={4}
        className="p-0 w-[var(--radix-popover-trigger-width)] min-w-[200px]"
      >
        <Command>
          {/* <CommandInput placeholder="検索..." /> */}
          <CommandList>
            <CommandEmpty>見つかりません</CommandEmpty>

            {/* 一括チェック */}
            <div className="flex items-center justify-between p-1">
              <Button
                variant="ghost"
                className="h-7 flex-1 text-xs"
                onClick={selectAll}
              >
                すべて選択
              </Button>
              <Button
                variant="ghost"
                className="h-7 flex-1 text-xs"
                onClick={clearAll}
              >
                解除
              </Button>
            </div>
            <CommandSeparator />

            {/* オプション一覧 */}
            <CommandGroup>
              {displayTypes.map((type) => {
                const isSelected = selectedTypes.includes(type);
                const Icon = TYPE_CONFIG[type].icon;
                return (
                  <CommandItem
                    key={type}
                    onSelect={() => toggleOption(type)}
                    className="flex items-center gap-2"
                  >
                    <div
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50 [&_svg]:invisible"
                      )}
                    >
                      <Check className="h-3 w-3" />
                    </div>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{TYPE_CONFIG[type].label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>

          <CommandSeparator />

          {/* 決定・キャンセル */}
          <div className="flex items-center justify-end gap-2 p-2 ">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={() => setOpen(false)}
            >
              キャンセル
            </Button>
            <Button
              variant="default"
              size="sm"
              className="h-8 px-3 text-xs"
              onClick={handleApply}
            >
              決定
            </Button>
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
