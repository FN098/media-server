import { ViewModeProvider } from "@/app/dashboard/explorer/ui/providers/view-mode-provider";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ViewModeProvider>{children}</ViewModeProvider>;
}
