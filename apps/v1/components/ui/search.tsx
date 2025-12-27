import { useShortcutKey } from "@/hooks/use-shortcut-keys";
import { Input } from "@/shadcn/components/ui/input";
import { useIsMobile } from "@/shadcn/hooks/use-mobile";
import { cn } from "@/shadcn/lib/utils";
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

  useShortcutKey({
    key: "Ctrl+k",
    callback: () => inputRef.current?.focus(),
  });

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        type="search"
        placeholder="Search…"
        className={cn("w-48", className)}
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
