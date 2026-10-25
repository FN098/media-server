import { TagEditorProvider } from "@/app/(pages)/(tag-editor)/_providers/tag-editor-provider";
import { HistoryProvider } from "@/app/(pages)/explorer/_providers/history-provider";
import { SlideshowProvider } from "@/feature/viewers/media-viewer/providers/slideshow-provider";

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
