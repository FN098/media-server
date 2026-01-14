/**
 * @see https://ui.shadcn.com/docs/dark-mode/next
 */

"use client";

import { useMounted } from "@/hooks/use-mounted";
import { Button } from "@/shadcn/components/ui/button";
import { Skeleton } from "@/shadcn/components/ui/skeleton";
import { cn } from "@/shadcn/lib/utils";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

/** @deprecated 使われていない */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  const isDark = theme === "dark";

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="icon"
        type="button"
        disabled
        className="rounded-full shrink-0"
      >
        <Skeleton className="h-9 w-9" />
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className="rounded-full shrink-0 bg-background dark:bg-background hover:bg-accent dark:hover:bg-accent"
    >
      <Sun
        className={cn(
          "absolute h-[1.2rem] w-[1.2rem] transition-all",
          isDark ? "scale-0 rotate-90" : "scale-100 rotate-0"
        )}
      />
      <Moon
        className={cn(
          "absolute h-[1.2rem] w-[1.2rem] transition-all",
          isDark ? "scale-100 rotate-0" : "scale-0 -rotate-90"
        )}
      />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
