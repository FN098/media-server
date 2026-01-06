import { Input } from "@/shadcn/components/ui/input";
import { cn } from "@/shadcn/lib/utils";
import { SearchIcon } from "lucide-react";
import { RefObject } from "react";

export function Search({
  value,
  setValue,
  className,
  inputRef,
  onFocus,
  onBlur,
}: {
  value: string;
  setValue: (value: string) => void;
  className?: string;
  inputRef?: RefObject<HTMLInputElement | null>;
  onFocus?: () => void;
  onBlur?: () => void;
}) {
  return (
    <div className="relative group">
      <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

      <Input
        ref={inputRef}
        type="search"
        placeholder="Search…"
        className={cn("w-full pl-9", className)}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
      />
    </div>
  );
}
