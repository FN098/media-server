import { Input } from "@/shadcn/components/ui/input";
import { cn } from "@/shadcn/lib/utils";
import { SearchIcon } from "lucide-react";
import { RefObject } from "react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  inputRef?: RefObject<HTMLInputElement | null>;
  placeholder?: string;
  onFocus?: () => void;
  onBlur?: () => void;
}

export function SearchInput({
  value,
  onChange,
  className,
  inputRef,
  placeholder,
  onFocus,
  onBlur,
}: SearchInputProps) {
  return (
    <div className="relative group">
      <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        ref={inputRef}
        type="search"
        placeholder={placeholder ?? "Search…"}
        className={cn("w-full", className)}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
      />
    </div>
  );
}
