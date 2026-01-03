import { ViewModeProvider } from "@/providers/view-mode-provider";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    // ここに書いたプロバイダーはページ遷移後も状態を維持（同一セクションの遷移に限る）
    <ViewModeProvider>{children}</ViewModeProvider>
  );
}
