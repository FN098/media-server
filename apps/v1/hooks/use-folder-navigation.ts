import { getClientExplorerPath } from "@/lib/path-helpers";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

type AutoMode = "first" | "last";

export function useFolderNavigation() {
  const router = useRouter();

  const navigateToFolder = useCallback(
    (path: string, auto?: AutoMode) => {
      const baseUrl = getClientExplorerPath(path);
      const url = auto ? `${baseUrl}?auto=${auto}` : baseUrl;
      router.push(url);
    },
    [router]
  );

  return { navigateToFolder };
}
