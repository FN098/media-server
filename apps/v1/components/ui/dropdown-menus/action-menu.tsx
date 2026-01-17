"use client";

import { useMounted } from "@/hooks/use-mounted";
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
import {
  FolderInput,
  MoreVertical,
  Pencil,
  RotateCcw,
  Tag,
  Trash2,
} from "lucide-react";
import { useState } from "react";

interface ActionMenuProps {
  node: MediaNode;
  className?: string;
  onOpenFolder?: (path: string) => void;
  onRename?: (node: MediaNode) => void;
  onMove?: (node: MediaNode) => void;
  onDelete?: (node: MediaNode) => void;
  onDeletePermanently?: (node: MediaNode) => void;
  onRestore?: (node: MediaNode) => void;
  onEditTags?: (node: MediaNode) => void;
}

export function ActionMenu({
  node,
  className,
  onOpenFolder,
  onRename,
  onMove,
  onDelete,
  onDeletePermanently,
  onRestore,
  onEditTags,
}: ActionMenuProps) {
  const [open, setOpen] = useState(false);

  const mounted = useMounted();
  if (!mounted) return null;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8 rounded-full", className)}
          onPointerDown={(e) => e.preventDefault()}
          onClick={() => setOpen((prev) => !prev)}
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
            <FolderInput className="mr-2 h-4 w-4" /> 移動
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
        {onRestore && (
          <DropdownMenuItem
            className="text-success focus:text-success"
            onClick={(e) => {
              e.stopPropagation();
              onRestore(node);
            }}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            復元
          </DropdownMenuItem>
        )}
        {onDelete && (
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(node);
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            削除
          </DropdownMenuItem>
        )}
        {onDeletePermanently && (
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDeletePermanently(node);
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            完全に削除
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
