"use client";

import { MediaNode } from "@/lib/media/types";
import { getParentDirPath } from "@/lib/path/helpers";
import { Button } from "@/shadcn/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shadcn/components/ui/dropdown-menu";
import { cn } from "@/shadcn/lib/utils";
import { FolderInput, MoreVertical, Pencil, Tag } from "lucide-react";

interface ActionMenuProps {
  node: MediaNode;
  onRename?: (node: MediaNode) => void;
  onMove?: (node: MediaNode) => void;
  onEditTags?: (node: MediaNode) => void;
  onOpenFolder?: (path: string) => void;
  className?: string;
}

export function ActionMenu({
  node,
  onRename,
  onMove,
  onEditTags,
  onOpenFolder,
  className,
}: ActionMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8 rounded-full", className)}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {onOpenFolder && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onOpenFolder(getParentDirPath(node.path));
            }}
          >
            <Pencil className="mr-2 h-4 w-4" /> フォルダを開く
          </DropdownMenuItem>
        )}
        {onRename && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onRename(node);
            }}
          >
            <Pencil className="mr-2 h-4 w-4" /> 名前の変更
          </DropdownMenuItem>
        )}
        {onMove && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onMove(node);
            }}
          >
            <FolderInput className="mr-2 h-4 w-4" /> 他のフォルダに移動
          </DropdownMenuItem>
        )}
        {onEditTags && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onEditTags(node);
            }}
          >
            <Tag className="mr-2 h-4 w-4" /> タグの編集
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
