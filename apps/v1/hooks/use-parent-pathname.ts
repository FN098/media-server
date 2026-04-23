import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export function useParentPathname() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const parentPathname = pathname.split("/").slice(0, -1).join("/") || "/";

  const navigateToParent = useCallback(() => {
    const qs = searchParams.toString();
    const url = qs ? `${parentPathname}?${qs}` : parentPathname;
    router.push(url);
  }, [parentPathname, searchParams, router]);

  return { parentPathname, navigateToParent };
}
