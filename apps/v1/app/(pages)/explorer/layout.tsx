import { HistoryProvider } from "@/providers/history-provider";
import { TagEditorProvider } from "@/providers/tag-editor-provider";
import { ViewModeProvider } from "@/providers/view-mode-provider";
import { ViewerUIProvider } from "@/providers/viewer-provider";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    // ここに書いたプロバイダーはページ遷移後も状態を維持（同一セクションの遷移に限る）
    <ViewerUIProvider>
      <TagEditorProvider>
        <HistoryProvider>
          <ViewModeProvider>{children}</ViewModeProvider>
        </HistoryProvider>
      </TagEditorProvider>
    </ViewerUIProvider>
  );
}
