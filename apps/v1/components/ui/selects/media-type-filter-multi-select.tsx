"use client";

import { MediaTypeFilterValue } from "@/lib/filter/types";
import { MediaFsNodeType } from "@/lib/media/types";
import { Badge } from "@/shadcn/components/ui/badge";
import { Button } from "@/shadcn/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
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
  Film,
  Folder,
  ImageIcon,
  Music,
  PlusCircle,
  XCircle,
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
  displayTypes = ["directory", "image", "video", "audio"],
}: MediaTypeFilterMultiSelectProps) {
  const selectedValues = new Set(value.types);

  const toggleOption = (type: MediaFsNodeType) => {
    const next = new Set(selectedValues);
    if (next.has(type)) {
      next.delete(type);
    } else {
      next.add(type);
    }
    onChange({ types: Array.from(next) });
  };

  const selectAll = () => onChange({ types: displayTypes });
  const clearAll = () => onChange({ types: [] });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("h-9 border-dashed flex items-center gap-2", className)}
        >
          <PlusCircle className="h-4 w-4" />
          <span className="text-sm font-medium">種別</span>
          {selectedValues.size > 0 && (
            <>
              <div className="hidden h-4 w-px bg-border lg:block" />
              <div className="flex gap-1">
                {selectedValues.size > 2 ? (
                  <Badge variant="secondary" className="px-1 font-normal">
                    {selectedValues.size} 選択中
                  </Badge>
                ) : (
                  displayTypes
                    .filter((t) => selectedValues.has(t))
                    .map((t) => (
                      <Badge
                        variant="secondary"
                        key={t}
                        className="px-1 font-normal"
                      >
                        {TYPE_CONFIG[t].label}
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput placeholder="検索..." />
          <CommandList>
            <CommandEmpty>見つかりません</CommandEmpty>

            {/* ショートカット操作 */}
            <div className="flex items-center justify-between p-1">
              <Button
                variant="ghost"
                className="h-8 flex-1 text-xs justify-center"
                onClick={selectAll}
              >
                すべて選択
              </Button>
              <Button
                variant="ghost"
                className="h-8 flex-1 text-xs justify-center"
                onClick={clearAll}
              >
                解除
              </Button>
            </div>
            <CommandSeparator />

            <CommandGroup>
              {displayTypes.map((type) => {
                const isSelected = selectedValues.has(type);
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
                    <span>{TYPE_CONFIG[type].label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>

            {selectedValues.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={clearAll}
                    className="justify-center text-center text-xs text-destructive"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    フィルターをクリア
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
