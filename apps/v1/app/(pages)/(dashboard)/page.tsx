import { Button } from "@/shadcn/components/ui/button";
import Link from "next/link";

export default function Page() {
  return (
    <div className="flex items-center justify-center h-screen">
      <Button asChild>
        <Link href="/explorer">Start Exploring</Link>
      </Button>
    </div>
  );
}
