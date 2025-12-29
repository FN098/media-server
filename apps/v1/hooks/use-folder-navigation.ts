import { getClientExplorerPath } from "@/lib/path-helpers";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

type AutoMode = "first" | "last";

export function useFolderNavigation(key: string = "auto") {
  const router = useRouter();

  const navigateToFolder = useCallback(
    (path: string, value?: AutoMode) => {
      const baseUrl = getClientExplorerPath(path);
      const url = value ? `${baseUrl}?${key}=${value}` : baseUrl;
      router.push(url);
    },
    [key, router]
  );

  return { navigateToFolder };
}
