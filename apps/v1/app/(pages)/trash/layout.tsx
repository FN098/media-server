import { HistoryProvider } from "@/providers/history-provider";
import { TagEditorProvider } from "@/providers/tag-editor-provider";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    // ここに書いたプロバイダーはページ遷移後も状態を維持（同一セクションの遷移に限る）
    <TagEditorProvider>
      <HistoryProvider>{children}</HistoryProvider>
    </TagEditorProvider>
  );
}
