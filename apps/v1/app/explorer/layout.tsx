import { ViewModeProvider } from "@/app/explorer/ui/providers/view-mode-provider";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <main>
      <ViewModeProvider>{children}</ViewModeProvider>
    </main>
  );
}
