import { ViewModeProvider } from "@/app/providers/view-mode-provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // ビューモードはページ遷移後も維持
    <ViewModeProvider>{children}</ViewModeProvider>
  );
}
