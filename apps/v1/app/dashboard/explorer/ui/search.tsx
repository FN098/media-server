import { Input } from "@/shadcn/components/ui/input";

export function Search({
  value,
  setValue,
}: {
  value: string;
  setValue: (value: string) => void;
}) {
  return (
    <Input
      type="search"
      placeholder="Search"
      className="w-48"
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
}
