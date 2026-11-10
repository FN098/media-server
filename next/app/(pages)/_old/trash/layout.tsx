import { SlideshowProvider } from "@/__feature/viewers/media-viewer/providers/slideshow-provider";
import { HistoryProvider } from "@/feature/history/providers/history-provider";
import { TagEditorProvider } from "@/feature/tag-editor/_providers/tag-editor-provider";

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
