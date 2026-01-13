import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shadcn/components/ui/accordion";
import { Badge } from "@/shadcn/components/ui/badge";
import { Button } from "@/shadcn/components/ui/button";
import { cn } from "@/shadcn/lib/utils";
import { Filter, X } from "lucide-react";

interface TagFilterAccordionProps {
  tags: string[];
  selectedTags: Set<string>;
  onToggle: (tag: string) => void;
  onClear: () => void;
}

/** @deprecated 使用されていない */
export function TagFilterAccordion({
  tags,
  selectedTags,
  onToggle,
  onClear,
}: TagFilterAccordionProps) {
  if (tags.length === 0) return null;

  const hasSelection = selectedTags.size > 0;

  return (
    <Accordion type="single" collapsible className="w-full border-none">
      <AccordionItem value="filter" className="border-none">
        <div className="flex items-center justify-between">
          <AccordionTrigger className="hover:no-underline py-2">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">タグで絞り込む</span>
              {hasSelection && (
                <Badge variant="secondary" className="ml-2 font-normal">
                  {selectedTags.size}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          {hasSelection && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="h-8 text-muted-foreground hover:text-destructive"
            >
              リセット
            </Button>
          )}
        </div>

        <AccordionContent className="pt-2 pb-4">
          <div className="flex flex-col gap-4">
            {/* タグ一覧 */}
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => {
                const isSelected = selectedTags.has(tag);
                return (
                  <Badge
                    key={tag}
                    variant={isSelected ? "default" : "secondary"}
                    className={cn(
                      "cursor-pointer px-3 py-1 transition-all",
                      isSelected
                        ? "ring-2 ring-primary ring-offset-1"
                        : "hover:bg-secondary/80"
                    )}
                    onClick={() => onToggle(tag)}
                  >
                    {tag}
                    {isSelected && <X className="ml-1.5 h-3 w-3" />}
                  </Badge>
                );
              })}
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
