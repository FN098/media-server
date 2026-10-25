import { cn } from "@/shadcn/lib/utils";
import { Loader2 } from "lucide-react";

type LoadingSpinnerProps = {
  className?: string;
};

export function LoadingSpinner({ className }: LoadingSpinnerProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <Loader2
        className={cn("h-8 w-8 animate-spin text-blue-500", className)}
      />
    </div>
  );
}
