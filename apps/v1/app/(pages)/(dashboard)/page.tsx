import { Button } from "@/shadcn/components/ui/button";
import Link from "next/link";

export default function Page() {
  return (
    <Button asChild>
      <Link href="/explorer">Start Exploring</Link>
    </Button>
  );
}
