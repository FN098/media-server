import { SlideshowProvider } from "@/__feature/viewers/media-viewer/providers/slideshow-provider";
import { HistoryProvider } from "@/feature/history/providers/history-provider";
import { TagEditorProvider } from "@/feature/tag-editor/_providers/tag-editor-provider";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <TagEditorProvider>
      <SlideshowProvider>
        <HistoryProvider>{children}</HistoryProvider>
      </SlideshowProvider>
    </TagEditorProvider>
  );
}
