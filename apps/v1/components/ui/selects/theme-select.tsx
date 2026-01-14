import { useMounted } from "@/hooks/use-mounted";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/components/ui/select";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeSelect() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  // マウント前はスケルトン、または空のボタンを表示してハイドレーションエラーを防ぐ
  if (!mounted) {
    return <div className="h-10 w-full animate-pulse bg-muted rounded-md" />;
  }

  return (
    <Select value={theme} onValueChange={(value) => setTheme(value)}>
      <SelectTrigger className="w-full">
        <div className="flex items-center gap-2">
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <SelectValue placeholder="Theme" />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="light">Light</SelectItem>
        <SelectItem value="dark">Dark</SelectItem>
        <SelectItem value="system">System</SelectItem>
      </SelectContent>
    </Select>
  );
}
