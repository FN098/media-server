import { Input } from "@/shadcn/components/ui/input";
import { cn } from "@/shadcn/lib/utils";
import { SearchIcon } from "lucide-react";

interface SearchInputProps extends React.ComponentProps<"input"> {
  // inputRef?: RefObject<HTMLInputElement | null>;
  placeholder?: string;
}

export function SearchInput({
  className,
  placeholder,
  ...rest
}: SearchInputProps) {
  return (
    <div className="relative group">
      <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        type="search"
        placeholder={placeholder ?? "Search…"}
        className={cn("w-full", className)}
        {...rest}
      />
    </div>
  );
}
