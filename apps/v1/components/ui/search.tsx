import { useShortcutKey } from "@/hooks/use-shortcut-keys";
import { Input } from "@/shadcn/components/ui/input";
import { useIsMobile } from "@/shadcn/hooks/use-mobile";
import { cn } from "@/shadcn/lib/utils";
import { useRef } from "react";

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
  const placeholder = isMobile ? "Search" : "Search (Ctrl + K)";

  useShortcutKey({
    key: "Ctrl+k",
    callback: () => inputRef.current?.focus(),
  });

  return (
    <Input
      ref={inputRef}
      type="search"
      placeholder={placeholder}
      className={cn("w-48", className)}
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
}
