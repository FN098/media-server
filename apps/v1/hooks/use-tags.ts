import { Tag } from "@/generated/prisma";
import { useQuery } from "@tanstack/react-query";

export function useTags(currentPaths?: string[]) {
  const { data, refetch, isLoading } = useQuery({
    queryKey: ["tags", currentPaths],
    queryFn: async () => {
      // 検索パラメータとしてパスを渡す（必要に応じて）
      const params = new URLSearchParams();
      if (currentPaths) params.append("paths", JSON.stringify(currentPaths));

      const res = await fetch(`/api/tags?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch tags");
      return res.json() as Promise<Tag[]>;
    },
    staleTime: 1000 * 60 * 5, // 5分間はキャッシュを利用
  });

  return {
    tags: data ?? [],
    refreshTags: refetch, // 新規タグ作成後に呼ぶ
    isLoading,
  };
}
