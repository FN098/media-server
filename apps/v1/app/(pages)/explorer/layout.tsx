import { ViewModeProvider } from "@/providers/view-mode-provider";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    // ビューモードはページ遷移後も維持
    <ViewModeProvider>{children}</ViewModeProvider>
  );
}
