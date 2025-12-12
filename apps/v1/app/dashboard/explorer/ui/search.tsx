import { Input } from "@/shadcn/components/ui/input";
import { cn } from "@/shadcn/lib/utils";

export function Search({
  value,
  setValue,
  className,
}: {
  value: string;
  setValue: (value: string) => void;
  className?: string;
}) {
  return (
    <Input
      type="search"
      placeholder="Search"
      className={cn("w-48", className)}
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
}
