import { useShortcutKeys } from "@/providers/shortcut-provider";
import { Input } from "@/shadcn/components/ui/input";
import { useIsMobile } from "@/shadcn/hooks/use-mobile";
import { cn } from "@/shadcn/lib/utils";
import { SearchIcon } from "lucide-react";
import { useRef, useState } from "react";

export function Search({
  value,
  setValue,
  className,
}: {
  value: string;
  setValue: (value: string) => void;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();
  const [focused, setFocused] = useState(false);

  useShortcutKeys([
    { key: "Ctrl+k", callback: () => inputRef.current?.focus() },
  ]);

  return (
    <div className="relative group">
      <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

      <Input
        ref={inputRef}
        type="search"
        placeholder="Search…"
        className={cn("w-48 pl-9", className)}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />

      {!focused && !isMobile && (
        <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 text-xs text-muted-foreground">
          <kbd className="rounded border px-1.5 py-0.5">Ctrl</kbd>
          <kbd className="rounded border px-1.5 py-0.5">K</kbd>
        </div>
      )}
    </div>
  );
}
