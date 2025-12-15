import { useShortcutKey } from "@/app/hooks/use-shortcut-keys";
import { Input } from "@/shadcn/components/ui/input";
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

  useShortcutKey({
    key: "Ctrl+k",
    callback: () => inputRef.current?.focus(),
  });

  return (
    <Input
      ref={inputRef}
      type="search"
      placeholder="Search (Ctrl + K)"
      className={cn("w-48", className)}
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
}
