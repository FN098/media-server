import { HistoryProvider } from "@/providers/navigation/history-provider";
import { TagEditorProvider } from "@/providers/tag-editor/tag-editor-provider";
import { SlideshowProvider } from "@/providers/viewer/slideshow-provider";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    // ここに書いたプロバイダーはページ遷移後も状態を維持（同一セクションの遷移に限る）
    <TagEditorProvider>
      <SlideshowProvider>
        <HistoryProvider>{children}</HistoryProvider>
      </SlideshowProvider>
    </TagEditorProvider>
  );
}
