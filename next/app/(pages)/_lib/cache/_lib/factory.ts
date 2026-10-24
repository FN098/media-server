import { QueryClient } from "@tanstack/react-query";

/**
 * アプリケーション共通の QueryClient を生成する。
 *
 * QueryClient は状態を保持するためシングルトンとして扱う必要があり、
 * この関数は生成時の共通設定を一箇所に集約するために使用する。
 */
export function createAppQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // API の負荷と画面の応答性のバランスを考慮し、
        // 30 秒間はキャッシュを再利用する
        staleTime: 30_000,

        // フォーカス切り替えのたびに通信が発生すると
        // UX が不安定になるため無効化
        refetchOnWindowFocus: false,
      },
    },
  });
}
